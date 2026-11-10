"""Run one approved Windows command with closed stdin and a process-tree deadline."""

import argparse
import ctypes
import json
import math
import os
import subprocess
import sys
import time
from ctypes import wintypes


TIMEOUT_EXIT = 124
RUNNER_ERROR_EXIT = 125
POLL_SECONDS = 0.05
CLEANUP_SECONDS = 3
JOB_BASIC_ACCOUNTING = 1
JOB_EXTENDED_LIMITS = 9
KILL_ON_JOB_CLOSE = 0x2000
PROCESS_TERMINATE = 0x0001
PROCESS_SET_QUOTA = 0x0100

# The launcher cannot create descendants until it is attached to the job.
GATED_LAUNCH = """\
import msvcrt, os, subprocess, sys
status = msvcrt.open_osfhandle(int(sys.argv[1]), os.O_WRONLY)
os.set_inheritable(status, False)
if sys.stdin.buffer.read(1) != b'1':
    sys.exit(125)
try:
    code = subprocess.call(sys.argv[2:], stdin=subprocess.DEVNULL)
except OSError as error:
    os.write(status, b'E')
    print(f'Pillow could not start the command (WinError {error.winerror})', file=sys.stderr)
    sys.exit(125)
sys.exit(code)
"""


class BasicLimits(ctypes.Structure):
    _fields_ = [
        ("process_time", ctypes.c_int64),
        ("job_time", ctypes.c_int64),
        ("flags", wintypes.DWORD),
        ("min_working_set", ctypes.c_size_t),
        ("max_working_set", ctypes.c_size_t),
        ("active_process_limit", wintypes.DWORD),
        ("affinity", ctypes.c_size_t),
        ("priority", wintypes.DWORD),
        ("scheduling_class", wintypes.DWORD),
    ]


class ExtendedLimits(ctypes.Structure):
    _fields_ = [
        ("basic", BasicLimits),
        ("io_counters", ctypes.c_uint64 * 6),
        ("process_memory_limit", ctypes.c_size_t),
        ("job_memory_limit", ctypes.c_size_t),
        ("peak_process_memory", ctypes.c_size_t),
        ("peak_job_memory", ctypes.c_size_t),
    ]


class BasicAccounting(ctypes.Structure):
    _fields_ = [
        ("user_time", ctypes.c_int64),
        ("kernel_time", ctypes.c_int64),
        ("period_user_time", ctypes.c_int64),
        ("period_kernel_time", ctypes.c_int64),
        ("page_faults", wintypes.DWORD),
        ("total_processes", wintypes.DWORD),
        ("active_processes", wintypes.DWORD),
        ("terminated_processes", wintypes.DWORD),
    ]


def windows_api():
    api = ctypes.WinDLL("kernel32", use_last_error=True)
    handle, dword, pointer, boolean = (
        wintypes.HANDLE, wintypes.DWORD, wintypes.LPVOID, wintypes.BOOL,
    )
    signatures = {
        "CreateJobObjectW": (handle, pointer, wintypes.LPCWSTR),
        "SetInformationJobObject": (boolean, handle, ctypes.c_int, pointer, dword),
        "QueryInformationJobObject": (boolean, handle, ctypes.c_int, pointer, dword, pointer),
        "OpenProcess": (handle, dword, boolean, dword),
        "AssignProcessToJobObject": (boolean, handle, handle),
        "TerminateJobObject": (boolean, handle, wintypes.UINT),
        "CloseHandle": (boolean, handle),
    }
    for name, (result, *args) in signatures.items():
        function = getattr(api, name)
        function.restype = result
        function.argtypes = args
    return api


def checked(result):
    if not result:
        raise ctypes.WinError(ctypes.get_last_error())
    return result


def wait_for_empty_job(api, job, deadline):
    info = BasicAccounting()
    remaining = deadline - time.monotonic()
    while remaining > 0:
        checked(api.QueryInformationJobObject(
            job, JOB_BASIC_ACCOUNTING, ctypes.byref(info), ctypes.sizeof(info), None,
        ))
        if info.active_processes == 0:
            return True
        time.sleep(min(POLL_SECONDS, remaining))
        remaining = deadline - time.monotonic()
    return False


def launch(command, status_writer):
    import msvcrt

    handle = msvcrt.get_osfhandle(status_writer)
    os.set_handle_inheritable(handle, True)
    startup = subprocess.STARTUPINFO(lpAttributeList={"handle_list": [handle]})
    return subprocess.Popen(
        [sys.executable, "-I", "-S", "-c", GATED_LAUNCH, str(handle), *command],
        stdin=subprocess.PIPE, startupinfo=startup,
    )


def run(command, deadline):
    api = windows_api()
    job = checked(api.CreateJobObjectW(None, None))
    try:
        limits = ExtendedLimits()
        limits.basic.flags = KILL_ON_JOB_CLOSE
        checked(api.SetInformationJobObject(
            job, JOB_EXTENDED_LIMITS, ctypes.byref(limits), ctypes.sizeof(limits),
        ))
        status_reader, status_writer = os.pipe()
        with os.fdopen(status_reader, "rb") as status:
            try:
                process = launch(command, status_writer)
            finally:
                os.close(status_writer)
            with process.stdin as gate:
                handle = checked(api.OpenProcess(
                    PROCESS_TERMINATE | PROCESS_SET_QUOTA, False, process.pid,
                ))
                try:
                    checked(api.AssignProcessToJobObject(job, handle))
                    if time.monotonic() < deadline:
                        gate.write(b"1")
                finally:
                    api.CloseHandle(handle)
            if wait_for_empty_job(api, job, deadline):
                code = process.wait(timeout=CLEANUP_SECONDS)
                if status.read(1):
                    return "runner_error", RUNNER_ERROR_EXIT, "stopped"
                return "completed", code, "stopped"
        checked(api.TerminateJobObject(job, TIMEOUT_EXIT))
        if wait_for_empty_job(api, job, time.monotonic() + CLEANUP_SECONDS):
            return "timed_out", TIMEOUT_EXIT, "stopped"
        return "timed_out", TIMEOUT_EXIT, "unverified"
    finally:
        api.CloseHandle(job)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=float, required=True, help="wall-clock seconds")
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        parser.error("--timeout must be finite and positive")
    if len(args.command) < 2 or args.command[0] != "--":
        parser.error("supply a command after --")

    start = time.monotonic()
    status, code, tree = "runner_error", RUNNER_ERROR_EXIT, "unverified"
    if sys.platform != "win32":
        print("Pillow's bundled runner requires Windows", file=sys.stderr)
    else:
        try:
            status, code, tree = run(args.command[1:], start + args.timeout)
        except (OSError, subprocess.TimeoutExpired, KeyboardInterrupt) as error:
            detail = getattr(error, "winerror", None) or getattr(error, "errno", None)
            print(f"Pillow runner error: {type(error).__name__} ({detail})", file=sys.stderr)

    print("\nPILLOW_EXEC " + json.dumps({
        "status": status,
        "exit_code": code,
        "tree": tree,
        "elapsed_ms": round((time.monotonic() - start) * 1000),
    }), file=sys.stderr, flush=True)
    return code


if __name__ == "__main__":
    sys.exit(main())
