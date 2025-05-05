-- Try with various formats for the managed identity name

-- Option 1: App name
CREATE USER [salyersaipmapp] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [salyersaipmapp];
ALTER ROLE db_datawriter ADD MEMBER [salyersaipmapp];

-- Option 2: Static Web App hostname
/*
CREATE USER [victorious-field-05d13d20f] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [victorious-field-05d13d20f];
ALTER ROLE db_datawriter ADD MEMBER [victorious-field-05d13d20f];
*/

-- Option 3: Try with spn_ prefix (common for service principals)
/*
CREATE USER [spn_salyersaipmapp] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [spn_salyersaipmapp];
ALTER ROLE db_datawriter ADD MEMBER [spn_salyersaipmapp];
*/

-- Option 4: Try with object ID directly from portal 
-- (Go to Static Web App > Identity > System Assigned > Copy Object ID)
/*
-- Replace with your object ID
DECLARE @ObjectID NVARCHAR(128) = 'YOUR-MANAGED-IDENTITY-OBJECT-ID';
DECLARE @sql NVARCHAR(MAX) = 
    'CREATE USER [' + @ObjectID + '] FROM EXTERNAL PROVIDER;' + 
    'ALTER ROLE db_datareader ADD MEMBER [' + @ObjectID + '];' + 
    'ALTER ROLE db_datawriter ADD MEMBER [' + @ObjectID + '];';
EXEC sp_executesql @sql;
*/ 