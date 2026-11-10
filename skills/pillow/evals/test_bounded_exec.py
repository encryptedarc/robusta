import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


RUNNER = Path(__file__).resolve().parents[1] / "scripts" / "bounded_exec.py"


@unittest.skipUnless(sys.platform == "win32", "requires Windows Job Objects")
class BoundedExecTests(unittest.TestCase):
    def run_command(self, code, timeout=4, *args):
        return self.run_executable([sys.executable, "-c", code, *args], timeout)

    def run_executable(self, command, timeout):
        result = subprocess.run(
            [sys.executable, str(RUNNER), "--timeout", str(timeout), "--", *command],
            capture_output=True, text=True, timeout=10,
        )
        prefix = "PILLOW_EXEC "
        records = [line[len(prefix):] for line in result.stderr.splitlines()
                   if line.startswith(prefix)]
        self.assertEqual(len(records), 1, result.stderr)
        return result, json.loads(records[0])

    def test_command_gets_eof_and_keeps_its_exit_code(self):
        result, receipt = self.run_command(
            "import sys; print(repr(sys.stdin.read()), flush=True); sys.exit(124)"
        )
        self.assertEqual(result.stdout.strip(), "''")
        self.assertEqual(result.returncode, 124)
        self.assertEqual(receipt["status"], "completed")
        self.assertEqual(receipt["exit_code"], 124)
        self.assertEqual(receipt["tree"], "stopped")

    def test_missing_executable_is_a_runner_error(self):
        with tempfile.TemporaryDirectory() as directory:
            command = [str(Path(directory) / "missing.exe")]
            result, receipt = self.run_executable(command, 4)
        self.assertEqual(result.returncode, 125)
        self.assertEqual(receipt["status"], "runner_error")
        self.assertEqual(receipt["tree"], "stopped")

    def test_receipt_starts_on_its_own_line_after_partial_stderr(self):
        result, receipt = self.run_command("import sys; sys.stderr.write('partial output')")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stderr.splitlines()[0], "partial output")
        self.assertEqual(receipt["status"], "completed")
        self.assertEqual(receipt["tree"], "stopped")

    def test_timeout_stops_child_after_root_exits(self):
        with tempfile.TemporaryDirectory(prefix="pillow test ") as directory:
            started = Path(directory) / "started"
            child_code = (
                "from pathlib import Path; import os,sys,time; "
                "Path(sys.argv[1]).write_text(str(os.getpid())); time.sleep(30)"
            )
            parent_code = (
                "import subprocess,sys; "
                f"subprocess.Popen([sys.executable, '-c', {child_code!r}, sys.argv[1]])"
            )
            result, receipt = self.run_command(parent_code, 2, str(started))
            self.assertTrue(started.is_file(), result.stderr)
            self.assertEqual(result.returncode, 124)
            self.assertEqual(receipt["status"], "timed_out")
            self.assertEqual(receipt["tree"], "stopped")
            processes = subprocess.check_output(
                ["tasklist", "/FI", f"PID eq {started.read_text()}", "/FO", "CSV", "/NH"],
                text=True, timeout=5,
            )
            self.assertNotIn(f'"{started.read_text()}"', processes)


if __name__ == "__main__":
    unittest.main()
