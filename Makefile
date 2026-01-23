# ---------- CONFIG ----------

# Main dependencies
PACKAGES = react react-dom @tanstack/react-query jose gsap reactflow next framer-motion react-hook-form lucide-react react-icons firebase swr tailwindcss @tailwindcss/postcss postcss autoprefixer @prisma/client prisma next-themes
#  Dev dependencies
DEV_PACKAGES = @types/react @types/react-dom

# Install all dependencies
install:
	npm install $(PACKAGES) --save && npm install $(DEV_PACKAGES) --save-dev
	@echo "All packages installed!"

# Start the Next.js dev server
dev:
	npm run dev
	
# Build the project for production
build:
	npm run build

#  Run Prisma generate
prisma-generate:
	npx prisma generate

#  Clean node_modules & reinstall everything
reset:
	rm -rf node_modules package-lock.json
	npm install
	@echo "♻️ Project reset completed!"

#  Fix Tailwind PostCSS plugin
fix-tailwind:
	npm install -D @tailwindcss/postcss
	@echo "🔧 Tailwind PostCSS plugin installed successfully!"
	@echo "💡 Make sure your postcss.config.js has '@tailwindcss/postcss' instead of 'tailwindcss'."

#  Fix next.config.js to CommonJS format
fix-next-config:
	@echo "🔄 Fixing next.config.js to CommonJS format..."
	@echo "/** @type {import('next').NextConfig} */" > next.config.js
	@echo "const nextConfig = { reactStrictMode: true };" >> next.config.js
	@echo "module.exports = nextConfig;" >> next.config.js
	@echo "✅ next.config.js fixed."

#  All-in-one setup + open folder + start dev server
setup:
	@echo "🔄 Running full setup..."
	make install
	make fix-tailwind
	make prisma-generate
	make fix-next-config
	@echo "🚀 Starting dev server..."
	make dev
