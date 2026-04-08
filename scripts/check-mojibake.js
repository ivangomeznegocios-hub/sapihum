const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const SCAN_PATHS = ["src", "scripts"]
const EXTRA_FILES = [".editorconfig", ".vscode/settings.json", "package.json"]
const SKIP_DIRS = new Set([".git", ".next", "node_modules", "test-results"])
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".css", ".html"])
const SUSPECT_RE = new RegExp("[\\u00C3\\u00C2\\u00E2\\uFFFD]")

function walk(dir, files) {
  if (!fs.existsSync(dir)) return

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, files)
      continue
    }

    if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
}

function collectFiles() {
  const files = []

  for (const scanPath of SCAN_PATHS) {
    walk(path.join(ROOT, scanPath), files)
  }

  for (const relativePath of EXTRA_FILES) {
    const fullPath = path.join(ROOT, relativePath)
    if (fs.existsSync(fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}

function findIssues(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const issues = []

  content.split(/\r?\n/).forEach((line, index) => {
    if (SUSPECT_RE.test(line)) {
      issues.push(`${path.relative(ROOT, filePath)}:${index + 1}: ${line.trim()}`)
    }
  })

  return issues
}

const problems = collectFiles().flatMap(findIssues)

if (problems.length > 0) {
  console.error("Possible mojibake detected:")
  for (const problem of problems) {
    console.error(problem)
  }
  process.exit(1)
}

console.log("No mojibake patterns found.")
