#!/bin/bash

echo "📊 Process List"
echo "--------------"

ps aux | head -n 20

echo "--------------"
echo "✨ Showing top 20 processes"

echo "🔍 Checking port 3000..."
lsof -i :3000

# Alternative using netstat if lsof is not available
# netstat -tulpn | grep :3000

# Kill process if PID provided
if [ ! -z "$1" ]; then
  echo "🛑 Killing process $1..."
  kill $1 || kill -9 $1
fi 