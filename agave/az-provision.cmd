@rem provision a storage and distribution point
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


call az login
call az account set --subscription %SUBSCRIPTION%
call az group create --name %GROUP_NAME% --location %REGION%
@rem do the following to avoid having to repeat these params over and over
call az configure -d group=%GROUP_NAME%
call az configure -d location=%REGION%
call az storage account create --name %ROOT_NAME%stg
call az storage blob service-properties update --account-name %ROOT_NAME%stg --static-website --404-document 404.html --index-document taskpane.html
call az cdn profile create -n %ROOT_NAME%cdn --sku Standard_Microsoft
call az cdn endpoint create -n %ROOT_NAME%cdnendpoint --profile-name %ROOT_NAME%cdn --origin %ROOT_NAME%stg.z22.web.core.windows.net --origin-host-header %ROOT_NAME%stg.z22.web.core.windows.net --enable-compression

echo.
echo PROVISIONING DONE. Scroll up and check any errors carefully!!!!
echo.
echo To publish, use %ROOT_NAME%stg as the storage account name
echo.
echo EXAMPLE:
echo      az-publish %ROOT_NAME%stg
echo.
echo IMPORTANT: You need to go to Azure Portal and assign [Storage Blob Data Contributor] 
echo and [Storage Queue Data Contributor] roles for whatever Azure account login(s) you intend
echo to use during PUBLISH operations
echo.
echo Change webpack.config.js to properly define the production url:
echo.
echo	const urlProd = "https://%ROOT_NAME%cdnendpoint.azureedge.net/";
echo.
echo To build:
echo     npm run build
echo.
echo To publish:
echo     npm run publish

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