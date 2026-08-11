from ssl import SSLContext

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
    assert isinstance(engine_kwargs["connect_args"]["ssl"], SSLContext)
