@echo off

if exist node_modules\ (
  node .
  pause
) else (
  call npm i -f >> NUL
  node .
  pause
)