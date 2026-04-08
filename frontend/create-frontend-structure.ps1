# Run this from:
# C:\Users\buisn\OneDrive\Desktop\Youtubelearning\backend\frontend

$base = "src"

$folders = @(
    "$base/app",
    "$base/assets",
    "$base/components",
    "$base/components/common",
    "$base/components/landing",
    "$base/components/layout",
    "$base/components/video",
    "$base/context",
    "$base/hooks",
    "$base/layouts",
    "$base/pages",
    "$base/services",
    "$base/utils"
)

$files = @(
    "$base/App.jsx",
    "$base/index.css",
    "$base/main.jsx",

    "$base/app/router.jsx",
    "$base/app/constants.js",

    "$base/components/common/Button.jsx",
    "$base/components/common/Card.jsx",
    "$base/components/common/SectionHeading.jsx",
    "$base/components/common/ThemeToggle.jsx",

    "$base/components/landing/HeroSection.jsx",
    "$base/components/landing/FeatureGrid.jsx",
    "$base/components/landing/FloatingOrbs.jsx",

    "$base/components/layout/Navbar.jsx",
    "$base/components/layout/Sidebar.jsx",

    "$base/components/video/AiTabs.jsx",
    "$base/components/video/TranscriptPanel.jsx",
    "$base/components/video/VideoInfoCard.jsx",

    "$base/context/ThemeContext.jsx",
    "$base/hooks/useTheme.js",

    "$base/layouts/MainLayout.jsx",
    "$base/layouts/AppLayout.jsx",

    "$base/pages/LandingPage.jsx",
    "$base/pages/LoginPage.jsx",
    "$base/pages/RegisterPage.jsx",
    "$base/pages/DashboardPage.jsx",
    "$base/pages/VideoLearningPage.jsx",
    "$base/pages/AnalyticsPage.jsx",
    "$base/pages/SettingsPage.jsx",

    "$base/services/api.js",
    "$base/services/authService.js",
    "$base/services/videoService.js",
    "$base/services/aiService.js",

    "$base/utils/helpers.js"
)

Write-Host "`nCreating folders..." -ForegroundColor Cyan
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "Created folder: $folder" -ForegroundColor Green
    } else {
        Write-Host "Folder already exists: $folder" -ForegroundColor Yellow
    }
}

Write-Host "`nCreating files..." -ForegroundColor Cyan
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force | Out-Null
        Write-Host "Created file: $file" -ForegroundColor Green
    } else {
        Write-Host "File already exists: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nFrontend structure ready ✅" -ForegroundColor Magenta