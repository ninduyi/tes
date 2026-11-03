#!/bin/bash
# Script untuk menjalankan Dunia Baty 3D secara lokal dan membukanya di browser

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cari port yang tersedia mulai dari 8080
PORT=8080
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT+1))
done

echo "=========================================================="
echo "   DUNIA BATY 3D: PETUALANGAN EKOLOKASI KAWANAN"
echo "=========================================================="
echo "Direktori : $DIR"
echo "Port Aktif: $PORT"
echo "URL       : http://localhost:$PORT"
echo "Tekan Ctrl+C di terminal ini untuk menghentikan server."
echo "=========================================================="

# Buka browser secara otomatis di macOS
(sleep 1 && open "http://localhost:$PORT") &

# Jalankan Python HTTP server pada port yang pasti tersedia
python3 -m http.server $PORT --directory "$DIR"
