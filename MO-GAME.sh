#!/bin/sh
# BangBang — ban tai ve (Mac/Linux): mo game bang may chu web cuc bo (localhost:8000).
# KHONG mo truc tiep index.html: Chrome chan fetch() tu file:// nen game se bao
# "Khong tai duoc du lieu game (assets/data2.json)" va dung lai.
cd "$(dirname "$0")"
echo "Mo game BangBang (ban tai ve) tai http://localhost:8000/ (nhan Ctrl+C de dung)"
(sleep 1; xdg-open http://localhost:8000/ 2>/dev/null || open http://localhost:8000/ 2>/dev/null) &
python3 -m http.server 8000
