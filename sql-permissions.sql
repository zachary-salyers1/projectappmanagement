-- Option 1: Try with the app name first
CREATE USER [salyersaipmapp] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [salyersaipmapp];
ALTER ROLE db_datawriter ADD MEMBER [salyersaipmapp];

-- If Option 1 fails, try with full resource ID format (uncomment and update with your values)
/*
DECLARE @MIName VARCHAR(128) = 'salyersaipmapp';
DECLARE @SubscriptionId VARCHAR(36) = 'YOUR-SUBSCRIPTION-ID'; -- Replace with your subscription ID
DECLARE @ResourceGroup VARCHAR(128) = 'Salyersai'; -- Replace with your resource group name

DECLARE @FullIdentityName NVARCHAR(MAX) = 
    'mi_' + @MIName + '_' + @SubscriptionId + '_' + @ResourceGroup;

DECLARE @sql NVARCHAR(MAX) = 
    'CREATE USER [' + @FullIdentityName + '] FROM EXTERNAL PROVIDER;' + 
    'ALTER ROLE db_datareader ADD MEMBER [' + @FullIdentityName + '];' + 
    'ALTER ROLE db_datawriter ADD MEMBER [' + @FullIdentityName + '];';

EXEC sp_executesql @sql;
*/ 