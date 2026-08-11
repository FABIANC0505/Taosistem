from ssl import CERT_NONE, CERT_REQUIRED, SSLContext

from app.core.database import _prepare_engine_config


def test_aiven_ssl_mode_url_uses_aiomysql_ssl_arg():
    database_url = (
        "mysql+aiomysql://avnadmin:secret@mysql-example.aivencloud.com:24162/"
        "defaultdb?ssl-mode=REQUIRED"
    )

    normalized_url, engine_kwargs = _prepare_engine_config(database_url)

    assert normalized_url == (
        "mysql+aiomysql://avnadmin:secret@mysql-example.aivencloud.com:24162/defaultdb"
    )
    ssl_context = engine_kwargs["connect_args"]["ssl"]
    assert isinstance(ssl_context, SSLContext)
    assert ssl_context.verify_mode == CERT_NONE
    assert ssl_context.check_hostname is False


def test_aiven_verify_identity_keeps_certificate_validation():
    database_url = (
        "mysql+aiomysql://avnadmin:secret@mysql-example.aivencloud.com:24162/"
        "defaultdb?ssl-mode=VERIFY_IDENTITY"
    )

    normalized_url, engine_kwargs = _prepare_engine_config(database_url)

    assert normalized_url == (
        "mysql+aiomysql://avnadmin:secret@mysql-example.aivencloud.com:24162/defaultdb"
    )
    ssl_context = engine_kwargs["connect_args"]["ssl"]
    assert ssl_context.verify_mode == CERT_REQUIRED
    assert ssl_context.check_hostname is True
