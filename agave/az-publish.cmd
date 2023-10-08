@rem publish dist
@echo off

setlocal

set SUBSCRIPTION=%1
set GROUP_NAME=%2
set REGION=%3
set ROOT_NAME=%4

if .%SUBSCRIPTION% == . echo No subscription specified!&goto LUsage
if .%GROUP_NAME% == . echo No group name specified!&goto LUsage
if .%REGION% == . echo No region specified!&goto LUsage
if .%ROOT_NAME% == . echo No root name specified!&goto LUsage

set STG_ACCOUNT=%ROOT_NAME%stg
if .%1 == . echo No publish account specified!&goto LExit

echo az storage blob sync -c $web -s ".\dist" --account-name %ROOT_NAME%stg
call az storage blob sync -c $web -s ".\dist" --account-name %ROOT_NAME%stg
echo az cdn endpoint purge --resource-group %GROUP_NAME% --name %ROOT_NAME%cdnendpoint --profile-name %ROOT_NAME%cdn --content-paths "/*" "/assets/*" "/help/*"
call az cdn endpoint purge --resource-group %GROUP_NAME% --name %ROOT_NAME%cdnendpoint --profile-name %ROOT_NAME%cdn --content-paths "/*" "/assets/*" "/help/*"

goto LExit
:LUsage
echo Usage:
echo az-provision ^<subscription-name^> ^<group-name^> ^<region^> ^<root-name^>
echo.
echo subscription-name: This is the name of the subscription associated with your azure login
echo group-name       : This will be the resource group created for all of your new resources
echo region           : This is the region for your resource group (e.g. "WestUs")
echo root-name        : This is the root name for all your resources. This will become the root name for things like the stg and cdn. MUST be all lowercase and no symbols

:LExit