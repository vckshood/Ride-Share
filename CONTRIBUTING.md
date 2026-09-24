# Contributing to RideShare Pro

First off, thank you for considering contributing to **RideShare Pro**! 🚀

Following these guidelines helps keep our codebase maintainable and ensures smooth collaboration.

---

## 🛠️ Development Workflow

### 1. Fork and Clone
Fork the repository on GitHub, then clone your fork locally:
```bash
git clone https://github.com/<your-username>/rideshare.git
cd rideshare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create a Feature Branch
Use descriptive branch naming conventions:
- `feat/feature-name` for new features
- `fix/bug-description` for bug fixes
- `docs/doc-updates` for documentation changes
- `refactor/component-cleanup` for code refactoring

```bash
git checkout -b feat/add-surge-heatmap
```

### 4. Code Standards
- Keep components modular and reusable under `src/components/`.
- Ensure new backend logic adheres to the OOP parity design in `src/lib/fareEngine.js`.
- Maintain clean styling using the existing CSS custom properties in `src/app/globals.css`.
- Avoid adding heavy third-party UI libraries unless justified.

### 5. Validate Before Committing
Verify that the project builds cleanly without errors:
```bash
npm run build
```

### 6. Commit Messages
Write clear, concise commit messages following Conventional Commits format:
- `feat: add live route distance calculator`
- `fix: correct bike surge multiplier threshold`
- `docs: update deployment credentials table`
- `refactor: optimize driver availability query`

### 7. Open a Pull Request
- Push your branch to GitHub.
- Open a Pull Request against the `main` branch.
- Fill out the provided Pull Request template.

---

## 🐛 Reporting Bugs

If you find a bug:
1. Check the [existing issues](https://github.com/vckshood/rideshare/issues) to avoid duplicates.
2. Open a new issue using our **Bug Report** template.
3. Include steps to reproduce, expected vs actual behavior, and relevant console logs.

---

## 💡 Suggesting Enhancements

Feature requests are warmly welcomed! Please open an issue using the **Feature Request** template and describe:
- The problem you want solved
- Your proposed solution or user story
- Any alternatives considered
