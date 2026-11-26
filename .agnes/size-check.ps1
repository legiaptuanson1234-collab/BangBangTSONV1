$root='E:\bangbang\BangBangTSONV1'
$all = Get-ChildItem $root -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\\.agnes\\' }
$sum = ($all | Measure-Object Length -Sum).Sum
Write-Host ("Total (no .git/.agnes): {0} files, {1} MiB = {2} bytes" -f $all.Count, [math]::Round($sum/1048576,1), $sum)
$underGiB = $sum -le 1073741824
Write-Host ("GitHub 1 GiB limit (1073741824 bytes): {0}" -f $(if($underGiB){'OK UNDER'}else{'EXCEEDS'}))
Write-Host ("Decimal 1 GB (1000000000 bytes): {0}" -f $(if($sum -gt 1000000000){'EXCEEDS'}else{'under'}))
$big100 = ($all | Where-Object { $_.Length -gt 104857600 }).Count
$big50 = ($all | Where-Object { $_.Length -gt 52428800 }).Count
Write-Host ("Files > 100 MiB (Git blocks): {0}" -f $big100)
Write-Host ("Files > 50 MiB (git warns):   {0}" -f $big50)
$top = $all | Sort-Object Length -Descending | Select-Object -First 1
Write-Host ("Largest file: {0} MiB - {1}" -f [math]::Round($top.Length/1048576,1), $top.Name)
