---
name: Refactor / Architectural Change
about: Describe this issue template's purpose here.
title: "【REFACTOR】"
labels: ''
assignees: silkcrestapp

---

### 🎯 Objective
What structural change are we making, and *why* is the current implementation no longer cutting it? (e.g., "Decoupling X from Y to make testing easier").

### 📋 Checklist
- [ ] Modify `path/to/file_a.py` to do X
- [ ] Update `path/to/file_b.py` to accept the new format
- [ ] Run existing test suite to ensure nothing broke

### ⚠️ Potential Risks / Side Effects
What else in the system relies on this that might break?
