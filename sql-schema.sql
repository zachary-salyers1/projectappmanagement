-- Create Projects table
CREATE TABLE Projects (
  ProjectId INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(500) NULL,
  StartDate DATETIME NULL,
  DueDate DATETIME NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'Not Started', -- Not Started, In Progress, Completed, On Hold
  Priority INT NOT NULL DEFAULT 2, -- 1=High, 2=Medium, 3=Low
  Owner NVARCHAR(100) NULL,
  CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Tasks table
CREATE TABLE Tasks (
  TaskId INT IDENTITY(1,1) PRIMARY KEY,
  ProjectId INT NOT NULL FOREIGN KEY REFERENCES Projects(ProjectId) ON DELETE CASCADE,
  Title NVARCHAR(200) NOT NULL,
  Description NVARCHAR(1000) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'To Do', -- To Do, In Progress, Completed, Blocked
  Priority INT NOT NULL DEFAULT 2, -- 1=High, 2=Medium, 3=Low
  AssignedTo NVARCHAR(100) NULL,
  DueDate DATETIME NULL,
  CompletedDate DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create stored procedure for creating a new project
CREATE PROCEDURE CreateProject
  @Name NVARCHAR(100),
  @Description NVARCHAR(500) = NULL,
  @StartDate DATETIME = NULL,
  @DueDate DATETIME = NULL,
  @Status NVARCHAR(50) = 'Not Started',
  @Priority INT = 2,
  @Owner NVARCHAR(100) = NULL
AS
BEGIN
  INSERT INTO Projects (Name, Description, StartDate, DueDate, Status, Priority, Owner)
  VALUES (@Name, @Description, @StartDate, @DueDate, @Status, @Priority, @Owner);
  
  SELECT SCOPE_IDENTITY() AS ProjectId;
END
GO

-- Create stored procedure for updating a project
CREATE PROCEDURE UpdateProject
  @ProjectId INT,
  @Name NVARCHAR(100),
  @Description NVARCHAR(500) = NULL,
  @StartDate DATETIME = NULL,
  @DueDate DATETIME = NULL,
  @Status NVARCHAR(50) = NULL,
  @Priority INT = NULL,
  @Owner NVARCHAR(100) = NULL
AS
BEGIN
  UPDATE Projects
  SET 
    Name = @Name,
    Description = @Description,
    StartDate = @StartDate,
    DueDate = @DueDate,
    Status = ISNULL(@Status, Status),
    Priority = ISNULL(@Priority, Priority),
    Owner = @Owner,
    UpdatedAt = GETDATE()
  WHERE ProjectId = @ProjectId;
  
  SELECT * FROM Projects WHERE ProjectId = @ProjectId;
END
GO 