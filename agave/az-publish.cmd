@rem publish dist
@echo off

setlocal

if .%1 == . echo No publish account specified!&goto LExit
set STG_ACCOUNT=%1

az storage blob upload-batch --account-name %STG_ACCOUNT% -s .\dist -d $web --auth-mode login

:LExit