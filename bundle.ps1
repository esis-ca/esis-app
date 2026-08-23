$baseDir = "C:\Users\rocac\.gemini\antigravity\scratch\esis-sistema-administrativo"
$html = Get-Content -Path "$baseDir\index.html" -Raw -Encoding UTF8
$css = Get-Content -Path "$baseDir\css\styles.css" -Raw -Encoding UTF8
$dataJs = Get-Content -Path "$baseDir\js\data.js" -Raw -Encoding UTF8
$storeJs = Get-Content -Path "$baseDir\js\store.js" -Raw -Encoding UTF8
$dashJs = Get-Content -Path "$baseDir\js\modules\dashboard.js" -Raw -Encoding UTF8
$factJs = Get-Content -Path "$baseDir\js\modules\facturacion.js" -Raw -Encoding UTF8
$bankJs = Get-Content -Path "$baseDir\js\modules\bancos.js" -Raw -Encoding UTF8
$expJs = Get-Content -Path "$baseDir\js\modules\gastos.js" -Raw -Encoding UTF8
$cxcJs = Get-Content -Path "$baseDir\js\modules\cxc.js" -Raw -Encoding UTF8
$cxpJs = Get-Content -Path "$baseDir\js\modules\cxp.js" -Raw -Encoding UTF8
$concilJs = Get-Content -Path "$baseDir\js\modules\conciliacion.js" -Raw -Encoding UTF8
$projJs = Get-Content -Path "$baseDir\js\modules\proyectos.js" -Raw -Encoding UTF8
$appJs = Get-Content -Path "$baseDir\js\app.js" -Raw -Encoding UTF8

$allScripts = "<script>`n" + $dataJs + "`n" + $storeJs + "`n" + $dashJs + "`n" + $factJs + "`n" + $bankJs + "`n" + $expJs + "`n" + $cxcJs + "`n" + $cxpJs + "`n" + $concilJs + "`n" + $projJs + "`n" + $appJs + "`n</script>"
$styleTag = "<style>`n" + $css + "`n</style>"

$standalone = $html.Replace('<link rel="stylesheet" href="css/styles.css">', $styleTag)
$scriptBlockRegex = '(?s)<script src="js/data.js"></script>.*?<script src="js/app.js"></script>'
$standalone = [regex]::Replace($standalone, $scriptBlockRegex, $allScripts)

Set-Content -Path "$baseDir\index_standalone.html" -Value $standalone -Encoding UTF8
Write-Output "index_standalone.html creado exitosamente!"
