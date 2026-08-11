import pytest

from app.core.config import Settings


def test_database_url_is_used_in_production():
    settings = Settings(
        _env_file=None,
        APP_ENV="production",
        DATABASE_URL="mysql://user:password@example.com:3306/taosistem",
        JWT_SECRET_KEY="test-secret",
    )

    assert (
        settings.get_database_url()
        == "mysql+aiomysql://user:password@example.com:3306/taosistem"
    )


def test_production_without_external_mysql_fails_fast():
    settings = Settings(
        _env_file=None,
        APP_ENV="production",
        DATABASE_URL=None,
        MYSQL_URL=None,
        MYSQLHOST=None,
        MYSQLUSER=None,
        MYSQLDATABASE=None,
        MYSQL_HOST="localhost",
        JWT_SECRET_KEY="test-secret",
    )

    with pytest.raises(ValueError, match="base MySQL externa"):
        settings.get_database_url()
