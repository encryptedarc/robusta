# Manifest contract

```json
{
  "title": "OCR → JSON",
  "documents": [{
    "id": "receipt-01",
    "title": "Receipt 01",
    "image": "receipt.png",
    "imageWidth": 946,
    "imageHeight": 1290,
    "ocr": "receipt.json",
    "annotationMethod": "Approximate visual annotation; not OCR engine bounding boxes",
    "crop": [185, 45, 530, 1210],
    "regions": [{
      "box": [0.37, 0.35, 0.23, 0.024],
      "fields": [{
        "path": "Supplier.TaxId",
        "kind": "direct",
        "evidence": "TAX ID: 0123456789012",
        "note": ""
      }]
    }],
    "fieldNotes": {
      "Currency": {
        "kind": "inferred",
        "evidence": "",
        "note": "THB inferred from Thai receipt context; no printed currency marker"
      }
    }
  }]
}
```

- `ocr`: either the supplied JSON object or a UTF-8 JSON file path. The output retains nulls, numeric/string types, original strings and original keys.
- `imageWidth`, `imageHeight`: original pixel dimensions; verify by inspecting the image. Supported embedded formats: PNG, JPEG, WebP, GIF. Avoid active SVG input.
- `crop`: optional `[x, y, width, height]` in original pixels, used only to frame the displayed photo. It must contain all regions. It does not change the coordinate system or rewrite the image.
- `box`: `[left, top, width, height]` normalized to the original uncropped image, each within `[0, 1]`. Boxes must have positive dimensions and stay in bounds. Keep boxes tight enough to distinguish adjacent fields, but do not imply pixel accuracy if placed visually.
- `path`: renderer syntax `Supplier.TaxId`, `Items[0].Amount`. For unusual property names use JSON bracket strings, such as `["name.with.dot"]`; nested example `Items[0]["weird.key"]`. Root primitive path is `$`.
- `kind`: `direct`, `transformed`, or `inferred`. `evidence` is the exact printed text when legible. `note` explains normalization or inference; required for non-direct mappings. Do not assign regions to null values or to `Raw`.
- `fieldNotes`: optional per-path metadata for unlocated fields. Use it to disclose contextual inferences without adding a false box. Unannotated non-null leaves show as “ยังไม่ระบุตำแหน่ง”; null leaves as “ไม่มีค่าใน JSON”.
- `annotationMethod`: required disclosure of whether coordinates came from OCR engine boxes or approximate manual/visual mapping. This is provenance, not confidence.

The renderer rejects invalid boxes, duplicate document IDs, nonexistent JSON paths, regions outside the crop, annotations on nulls/Raw, and unexplained transformations/inferences. It does not prove that evidence text matches the pixels; the author must visually verify that.
