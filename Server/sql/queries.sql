-- Active: 1760889632840@@localhost@5432@pockity_db@public
-- ============================================================================
-- POCKITY API MANAGEMENT SYSTEM - SQL QUERIES DOCUMENTATION
-- ============================================================================
-- Database: PostgreSQL
-- Description: Common queries for User, ApiKey, Usage, Audit, and Analytics
-- ============================================================================

-- ============================================================================
-- USER MANAGEMENT QUERIES
-- ============================================================================

-- 1. Get all users with their API key count and total requests
-- Usage: Admin dashboard overview, user analytics
SELECT
    u.id,
    u.email,
    u.name,
    u."authMethod",
    u."emailVerified",
    u.role,
    u."createdAt",
    COUNT(DISTINCT ak.id) as api_keys_count,
    COUNT(DISTINCT al.id) as total_requests
FROM
    "User" u
    LEFT JOIN "ApiKey" ak ON u.id = ak."userId"
    LEFT JOIN "AuditLog" al ON ak."accessKeyId" = al."apiAccessKeyId"
GROUP BY
    u.id
ORDER BY u."createdAt" DESC;

-- 2. Get active users (users with at least one active API key)
-- Usage: Dashboard analytics, active users metric
SELECT u.id, u.email, u.name, u.role, COUNT(ak.id) as active_keys_count
FROM "User" u
    INNER JOIN "ApiKey" ak ON u.id = ak."userId"
    AND ak."isActive" = true
GROUP BY
    u.id
HAVING
    COUNT(ak.id) > 0
ORDER BY active_keys_count DESC;

-- 3. Get user by email with authentication details
-- Usage: Login flow, authentication verification
SELECT
    id,
    email,
    name,
    picture,
    "passwordHash",
    "authMethod",
    "googleId",
    "emailVerified",
    role,
    "createdAt"
FROM "User"
WHERE
    email = 'user@example.com';

-- 4. Get user statistics
-- Usage: User profile page, account overview
SELECT
    u.id,
    u.email,
    u.name,
    COUNT(DISTINCT ak.id) as total_api_keys,
    COUNT(
        DISTINCT CASE
            WHEN ak."isActive" = true THEN ak.id
        END
    ) as active_api_keys,
    COALESCE(SUM(uc."bytesUsed"), 0) as total_storage_bytes,
    COALESCE(SUM(uc.objects), 0) as total_objects,
    COUNT(DISTINCT al.id) as total_requests,
    MAX(ak."lastUsedAt") as last_activity
FROM
    "User" u
    LEFT JOIN "ApiKey" ak ON u.id = ak."userId"
    LEFT JOIN "UsageCurrent" uc ON ak."accessKeyId" = uc."apiAccessKeyId"
    LEFT JOIN "AuditLog" al ON ak."accessKeyId" = al."apiAccessKeyId"
WHERE
    u.id = 'user_id_here'
GROUP BY
    u.id;

-- 5. Create new user (for reference - typically done via Prisma)
INSERT INTO
    "User" (
        id,
        email,
        name,
        "passwordHash",
        "authMethod",
        "emailVerified",
        role
    )
VALUES (
        'cuid_generated',
        'newuser@example.com',
        'John Doe',
        '$2b$10$hashedpassword',
        'PASSWORD',
        false,
        'USER'
    );

-- ============================================================================
-- API KEY MANAGEMENT QUERIES
-- ============================================================================

-- 6. Get all API keys for a user with usage statistics
-- Usage: User dashboard, API keys page
SELECT
    ak.id,
    ak."accessKeyId",
    ak.name,
    ak."totalStorage",
    ak."totalObjects",
    ak."isActive",
    ak."createdAt",
    ak."lastUsedAt",
    ak."revokedAt",
    COALESCE(uc."bytesUsed", 0) as current_bytes_used,
    COALESCE(uc.objects, 0) as current_objects,
    COUNT(DISTINCT al.id) as total_requests
FROM
    "ApiKey" ak
    LEFT JOIN "UsageCurrent" uc ON ak."accessKeyId" = uc."apiAccessKeyId"
    LEFT JOIN "AuditLog" al ON ak."accessKeyId" = al."apiAccessKeyId"
WHERE
    ak."userId" = 'user_id_here'
GROUP BY
    ak.id,
    uc."bytesUsed",
    uc.objects
ORDER BY ak."createdAt" DESC;

-- 7. Get API key details by access key ID
-- Usage: API authentication, request validation
SELECT
    ak.id,
    ak."accessKeyId",
    ak."secretHash",
    ak.name,
    ak."userId",
    ak."totalStorage",
    ak."totalObjects",
    ak."isActive",
    ak."lastUsedAt",
    u.email as user_email,
    u.name as user_name,
    u.role as user_role
FROM "ApiKey" ak
    INNER JOIN "User" u ON ak."userId" = u.id
WHERE
    ak."accessKeyId" = 'access_key_id_here'
    AND ak."isActive" = true;

-- 8. Get active API keys with their current usage
-- Usage: Admin dashboard, system overview
SELECT
    ak."accessKeyId",
    ak.name,
    u.email as user_email,
    ak."totalStorage" as storage_limit,
    COALESCE(uc."bytesUsed", 0) as storage_used,
    ak."totalObjects" as objects_limit,
    COALESCE(uc.objects, 0) as objects_used,
    ROUND(
        (
            COALESCE(uc."bytesUsed", 0)::numeric / NULLIF(ak."totalStorage", 0)
        ) * 100,
        2
    ) as storage_usage_percent,
    ROUND(
        (
            COALESCE(uc.objects, 0)::numeric / NULLIF(ak."totalObjects", 0)
        ) * 100,
        2
    ) as objects_usage_percent,
    ak."lastUsedAt"
FROM
    "ApiKey" ak
    INNER JOIN "User" u ON ak."userId" = u.id
    LEFT JOIN "UsageCurrent" uc ON ak."accessKeyId" = uc."apiAccessKeyId"
WHERE
    ak."isActive" = true
ORDER BY ak."lastUsedAt" DESC NULLS LAST;

-- 9. Find API keys nearing storage limit (>90%)
-- Usage: Admin monitoring, usage alerts
SELECT ak."accessKeyId", ak.name, u.email, ak."totalStorage", uc."bytesUsed", ROUND(
        (
            uc."bytesUsed"::numeric / ak."totalStorage"
        ) * 100, 2
    ) as usage_percent
FROM
    "ApiKey" ak
    INNER JOIN "User" u ON ak."userId" = u.id
    INNER JOIN "UsageCurrent" uc ON ak."accessKeyId" = uc."apiAccessKeyId"
WHERE
    ak."isActive" = true
    AND (
        uc."bytesUsed"::numeric / ak."totalStorage"
    ) > 0.90
ORDER BY usage_percent DESC;

-- 10. Revoke an API key (soft delete)
UPDATE "ApiKey"
SET
    "isActive" = false,
    "revokedAt" = CURRENT_TIMESTAMP
WHERE
    "accessKeyId" = 'access_key_to_revoke';

-- ============================================================================
-- API KEY REQUEST QUERIES
-- ============================================================================

-- 11. Get all pending API key requests
-- Usage: Admin review queue
SELECT
    akr.id,
    akr."requestType",
    akr."keyName",
    akr."apiAccessKeyId",
    akr."requestedStorage",
    akr."requestedObjects",
    akr.reason,
    akr.status,
    akr."createdAt",
    u.id as user_id,
    u.email as user_email,
    u.name as user_name
FROM "ApiKeyRequest" akr
    INNER JOIN "User" u ON akr."userId" = u.id
WHERE
    akr.status = 'PENDING'
ORDER BY akr."createdAt" ASC;

-- 12. Get API key requests for a user
-- Usage: User dashboard, request history
SELECT
    id,
    "requestType",
    "keyName",
    "requestedStorage",
    "requestedObjects",
    reason,
    status,
    "reviewerComment",
    "reviewedAt",
    "createdAt"
FROM "ApiKeyRequest"
WHERE
    "userId" = 'user_id_here'
ORDER BY "createdAt" DESC;

-- 13. Get request statistics by status
-- Usage: Admin analytics
SELECT
    status,
    COUNT(*) as count,
    COUNT(
        CASE
            WHEN "requestType" = 'CREATE' THEN 1
        END
    ) as create_requests,
    COUNT(
        CASE
            WHEN "requestType" = 'UPGRADE' THEN 1
        END
    ) as upgrade_requests
FROM "ApiKeyRequest"
GROUP BY
    status;

-- 14. Approve an API key request
UPDATE "ApiKeyRequest"
SET
    status = 'APPROVED',
    "reviewerId" = 'admin_user_id',
    "reviewerComment" = 'Approved for production use',
    "reviewedAt" = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE
    id = 'request_id_here';

-- 15. Reject an API key request
UPDATE "ApiKeyRequest"
SET
    status = 'REJECTED',
    "reviewerId" = 'admin_user_id',
    "reviewerComment" = 'Insufficient justification',
    "reviewedAt" = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE
    id = 'request_id_here';

-- ============================================================================
-- USAGE & ANALYTICS QUERIES
-- ============================================================================

-- 16. Get current usage for an API key
-- Usage: Usage dashboard, quota monitoring
SELECT
    uc.id,
    uc."apiAccessKeyId",
    uc."bytesUsed",
    uc.objects,
    uc."lastUpdated",
    ak."totalStorage" as storage_limit,
    ak."totalObjects" as objects_limit,
    ROUND(
        (
            uc."bytesUsed"::numeric / NULLIF(ak."totalStorage", 0)
        ) * 100,
        2
    ) as storage_usage_percent,
    ROUND(
        (
            uc.objects::numeric / NULLIF(ak."totalObjects", 0)
        ) * 100,
        2
    ) as objects_usage_percent
FROM
    "UsageCurrent" uc
    INNER JOIN "ApiKey" ak ON uc."apiAccessKeyId" = ak."accessKeyId"
WHERE
    uc."apiAccessKeyId" = 'access_key_id_here';

-- 17. Get total system usage across all API keys
-- Usage: Admin dashboard, system metrics
SELECT
    COUNT(DISTINCT ak.id) as total_api_keys,
    COUNT(DISTINCT ak."userId") as total_users,
    COALESCE(SUM(uc."bytesUsed"), 0) as total_bytes_used,
    COALESCE(SUM(uc.objects), 0) as total_objects,
    COUNT(DISTINCT al.id) as total_requests,
    COALESCE(AVG(uc."bytesUsed"), 0) as avg_bytes_per_key,
    COALESCE(AVG(uc.objects), 0) as avg_objects_per_key
FROM
    "ApiKey" ak
    LEFT JOIN "UsageCurrent" uc ON ak."accessKeyId" = uc."apiAccessKeyId"
    LEFT JOIN "AuditLog" al ON ak."accessKeyId" = al."apiAccessKeyId"
WHERE
    ak."isActive" = true;

-- 18. Get top 10 API keys by storage usage
-- Usage: Admin monitoring, capacity planning
SELECT
    ak."accessKeyId",
    ak.name,
    u.email as user_email,
    uc."bytesUsed",
    uc."bytesUsed" / (1024.0 * 1024.0) as usage_mb,
    uc."bytesUsed" / (1024.0 * 1024.0 * 1024.0) as usage_gb,
    ak."totalStorage" / (1024.0 * 1024.0 * 1024.0) as limit_gb
FROM
    "UsageCurrent" uc
    INNER JOIN "ApiKey" ak ON uc."apiAccessKeyId" = ak."accessKeyId"
    INNER JOIN "User" u ON ak."userId" = u.id
WHERE
    ak."isActive" = true
ORDER BY uc."bytesUsed" DESC
LIMIT 10;

-- 19. Get storage usage trends (requires time-series data or audit logs)
-- Usage: Analytics dashboard, usage charts
SELECT
    DATE (al."createdAt") as date,
    al."apiAccessKeyId",
    COUNT(*) as requests_count,
    COUNT(DISTINCT al."actorId") as unique_actors
FROM "AuditLog" al
WHERE
    al."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
    AND al."apiAccessKeyId" IS NOT NULL
GROUP BY
    DATE (al."createdAt"),
    al."apiAccessKeyId"
ORDER BY date DESC, requests_count DESC;

-- ============================================================================
-- AUDIT LOG QUERIES
-- ============================================================================

-- 20. Get recent audit logs for an API key
-- Usage: Activity monitoring, security audits
SELECT al.id, al."apiAccessKeyId", al."actorId", al.action, al.detail, al.metadata, al."createdAt"
FROM "AuditLog" al
WHERE
    al."apiAccessKeyId" = 'access_key_id_here'
ORDER BY al."createdAt" DESC
LIMIT 100;

-- 21. Get audit logs by action type
-- Usage: Security monitoring, action analysis
SELECT
    al.action,
    COUNT(*) as action_count,
    COUNT(DISTINCT al."apiAccessKeyId") as unique_keys,
    MIN(al."createdAt") as first_occurrence,
    MAX(al."createdAt") as last_occurrence
FROM "AuditLog" al
WHERE
    al."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY
    al.action
ORDER BY action_count DESC;

-- 22. Get audit logs with user information
-- Usage: Admin audit trail, compliance reporting
SELECT
    al.id,
    al.action,
    al.detail,
    al."createdAt",
    ak."accessKeyId",
    ak.name as key_name,
    u.email as user_email,
    u.name as user_name
FROM
    "AuditLog" al
    LEFT JOIN "ApiKey" ak ON al."apiAccessKeyId" = ak."accessKeyId"
    LEFT JOIN "User" u ON ak."userId" = u.id
WHERE
    al."createdAt" >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY al."createdAt" DESC
LIMIT 1000;

-- 23. Find suspicious activity (high request rate)
-- Usage: Security monitoring, rate limit detection
SELECT
    al."apiAccessKeyId",
    ak.name,
    u.email,
    COUNT(*) as request_count,
    COUNT(
        DISTINCT DATE_TRUNC('hour', al."createdAt")
    ) as active_hours,
    COUNT(*) / NULLIF(
        COUNT(
            DISTINCT DATE_TRUNC('hour', al."createdAt")
        ),
        0
    ) as avg_requests_per_hour
FROM
    "AuditLog" al
    INNER JOIN "ApiKey" ak ON al."apiAccessKeyId" = ak."accessKeyId"
    INNER JOIN "User" u ON ak."userId" = u.id
WHERE
    al."createdAt" >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY
    al."apiAccessKeyId",
    ak.name,
    u.email
HAVING
    COUNT(*) > 10000 -- Threshold for suspicious activity
ORDER BY request_count DESC;

-- ============================================================================
-- OTP (ONE-TIME PASSWORD) QUERIES
-- ============================================================================

-- 24. Get valid OTP for email and purpose
-- Usage: OTP verification during login/register
SELECT
    id,
    "otp_code",
    email,
    purpose,
    expiry
FROM "Otp"
WHERE
    email = 'user@example.com'
    AND purpose = 'LOGIN'
    AND expiry > CURRENT_TIMESTAMP
ORDER BY expiry DESC
LIMIT 1;

-- 25. Clean up expired OTPs
-- Usage: Maintenance task, database cleanup
DELETE FROM "Otp" WHERE expiry < CURRENT_TIMESTAMP;

-- 26. Get OTP statistics
-- Usage: System monitoring, OTP usage analysis
SELECT
    purpose,
    COUNT(*) as total_otps,
    COUNT(
        CASE
            WHEN expiry > CURRENT_TIMESTAMP THEN 1
        END
    ) as active_otps,
    COUNT(
        CASE
            WHEN expiry <= CURRENT_TIMESTAMP THEN 1
        END
    ) as expired_otps
FROM "Otp"
GROUP BY
    purpose;

-- ============================================================================
-- ADVANCED ANALYTICS QUERIES
-- ============================================================================

-- 27. User growth over time
-- Usage: Analytics dashboard, growth metrics
SELECT
    DATE_TRUNC('month', "createdAt") as month,
    COUNT(*) as new_users,
    SUM(COUNT(*)) OVER (
        ORDER BY DATE_TRUNC('month', "createdAt")
    ) as cumulative_users
FROM "User"
GROUP BY
    DATE_TRUNC('month', "createdAt")
ORDER BY month DESC;

-- 28. API key lifecycle analysis
-- Usage: Key management analytics
SELECT
    DATE_TRUNC('week', "createdAt") as week,
    COUNT(*) as keys_created,
    COUNT(
        CASE
            WHEN "isActive" = false THEN 1
        END
    ) as keys_revoked,
    ROUND(
        AVG(
            EXTRACT(
                EPOCH
                FROM (
                        COALESCE(
                            "revokedAt", CURRENT_TIMESTAMP
                        ) - "createdAt"
                    )
            ) / 86400
        ),
        2
    ) as avg_lifetime_days
FROM "ApiKey"
WHERE
    "createdAt" >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY
    DATE_TRUNC('week', "createdAt")
ORDER BY week DESC;

-- 29. Request approval rate
-- Usage: Admin efficiency metrics
SELECT
    DATE_TRUNC('week', "createdAt") as week,
    COUNT(*) as total_requests,
    COUNT(
        CASE
            WHEN status = 'APPROVED' THEN 1
        END
    ) as approved,
    COUNT(
        CASE
            WHEN status = 'REJECTED' THEN 1
        END
    ) as rejected,
    COUNT(
        CASE
            WHEN status = 'PENDING' THEN 1
        END
    ) as pending,
    ROUND(
        (
            COUNT(
                CASE
                    WHEN status = 'APPROVED' THEN 1
                END
            )::numeric / NULLIF(COUNT(*), 0)
        ) * 100,
        2
    ) as approval_rate,
    ROUND(
        AVG(
            EXTRACT(
                EPOCH
                FROM (
                        COALESCE(
                            "reviewedAt", CURRENT_TIMESTAMP
                        ) - "createdAt"
                    )
            ) / 3600
        ),
        2
    ) as avg_review_time_hours
FROM "ApiKeyRequest"
WHERE
    "createdAt" >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY
    DATE_TRUNC('week', "createdAt")
ORDER BY week DESC;

-- 30. System health check
-- Usage: Monitoring dashboard, health status
SELECT (
        SELECT COUNT(*)
        FROM "User"
    ) as total_users,
    (
        SELECT COUNT(*)
        FROM "User"
        WHERE
            "emailVerified" = true
    ) as verified_users,
    (
        SELECT COUNT(*)
        FROM "ApiKey"
        WHERE
            "isActive" = true
    ) as active_api_keys,
    (
        SELECT COUNT(*)
        FROM "ApiKeyRequest"
        WHERE
            status = 'PENDING'
    ) as pending_requests,
    (
        SELECT COALESCE(SUM("bytesUsed"), 0)
        FROM "UsageCurrent"
    ) as total_storage_bytes,
    (
        SELECT COALESCE(SUM(objects), 0)
        FROM "UsageCurrent"
    ) as total_objects,
    (
        SELECT COUNT(*)
        FROM "AuditLog"
        WHERE
            "createdAt" >= CURRENT_DATE
    ) as requests_today,
    (
        SELECT COUNT(DISTINCT "apiAccessKeyId")
        FROM "AuditLog"
        WHERE
            "createdAt" >= CURRENT_DATE
    ) as active_keys_today;

-- ============================================================================
-- MAINTENANCE & CLEANUP QUERIES
-- ============================================================================

-- 31. Archive old audit logs (keep last 90 days)
-- Usage: Database maintenance, performance optimization
DELETE FROM "AuditLog"
WHERE
    "createdAt" < CURRENT_DATE - INTERVAL '90 days';

-- 32. Find inactive API keys (not used in 30 days)
-- Usage: Cleanup recommendations, cost optimization
SELECT ak."accessKeyId", ak.name, u.email, ak."lastUsedAt", EXTRACT(
        DAY
        FROM (
                CURRENT_TIMESTAMP - ak."lastUsedAt"
            )
    ) as days_since_last_use
FROM "ApiKey" ak
    INNER JOIN "User" u ON ak."userId" = u.id
WHERE
    ak."isActive" = true
    AND (
        ak."lastUsedAt" IS NULL
        OR ak."lastUsedAt" < CURRENT_DATE - INTERVAL '30 days'
    )
ORDER BY ak."lastUsedAt" ASC NULLS FIRST;

-- 33. Database size and table statistics
-- Usage: Database monitoring, capacity planning
SELECT
    schemaname,
    tablename,
    pg_size_pretty(
        pg_total_relation_size(
            schemaname || '.' || tablename
        )
    ) as size,
    pg_total_relation_size(
        schemaname || '.' || tablename
    ) as size_bytes
FROM pg_tables
WHERE
    schemaname = 'public'
ORDER BY pg_total_relation_size(
        schemaname || '.' || tablename
    ) DESC;

-- ============================================================================
-- END OF SQL QUERIES DOCUMENTATION
-- ============================================================================