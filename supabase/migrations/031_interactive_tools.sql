-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 031_interactive_tools
-- Adds html_content column to resources for
-- embedding interactive HTML tools directly
-- ============================================

-- HTML content stored directly (for interactive tools)
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS html_content TEXT DEFAULT NULL;

-- Tool display configuration (iframe dimensions, theme, etc.)
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS tool_config JSONB DEFAULT NULL;

-- Comments
COMMENT ON COLUMN public.resources.html_content IS 'Raw HTML content for interactive tools rendered in sandboxed iframes. NULL for non-tool resources.';
COMMENT ON COLUMN public.resources.tool_config IS 'Display configuration for tools: {width, height, allow_fullscreen, theme}';
