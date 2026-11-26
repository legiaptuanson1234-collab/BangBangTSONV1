# BangBang — ban tai ve: may chu web cuc nho (chi dung khi khong co Python).
# Chrome chan fetch() tu file:// nen mo truc tiep index.html se bao
# "Khong tai duoc du lieu game (assets/data2.json)" va dung lai.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "BangBang dang chay tai http://localhost:$port/ — nhan Ctrl+C de dung."
Start-Process "http://localhost:$port/"
$mime = @{ '.html'='text/html'; '.json'='application/json'; '.js'='text/javascript'; '.webp'='image/webp'; '.png'='image/png'; '.jpg'='image/jpeg'; '.mp3'='audio/mpeg'; '.css'='text/css'; '.txt'='text/plain'; '.md'='text/plain' }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request; $res = $ctx.Response
  $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
  $file = Join-Path $root $path
  if ((Test-Path $file -PathType Leaf) -and $file.StartsWith($root)) {
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $res.StatusCode = 404 }
  $res.OutputStream.Close()
}
