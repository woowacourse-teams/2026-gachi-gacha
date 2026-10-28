CREATE UNIQUE INDEX uk_member_oauth
    ON member (oauth_provider, oauth_id)
    WHERE is_deleted = false;
