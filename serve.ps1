# Servidor estático mínimo (sem Python/Node). Encerre com Ctrl+C.
param([int] $Port = 8080)

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "out"
if (-not (Test-Path $root)) {
    Write-Host "Pasta 'out' nao existe. Execute: python build.py" -ForegroundColor Yellow
    exit 1
}

$prefix = "http://127.0.0.1:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Abra no navegador: $prefix" -ForegroundColor Green
Write-Host "Ctrl+C para parar."

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        $path = $req.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }

        $rel = $path.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar
        $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
        if (-not $file.StartsWith([IO.Path]::GetFullPath($root), [StringComparison]::OrdinalIgnoreCase)) {
            $res.StatusCode = 403
            $res.Close()
            continue
        }

        if (Test-Path -LiteralPath $file -PathType Leaf) {
            $bytes = [IO.File]::ReadAllBytes($file)
            $res.ContentLength64 = $bytes.Length
            if ($file -match '\.css$') { $res.ContentType = "text/css; charset=utf-8" }
            elseif ($file -match '\.html?$') { $res.ContentType = "text/html; charset=utf-8" }
            elseif ($file -match '\.js$') { $res.ContentType = "application/javascript; charset=utf-8" }
            elseif ($file -match '\.svg$') { $res.ContentType = "image/svg+xml" }
            else { $res.ContentType = "application/octet-stream" }
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $res.StatusCode = 404
            $notFound = [Text.Encoding]::UTF8.GetBytes("404")
            $res.ContentLength64 = $notFound.Length
            $res.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $res.Close()
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
