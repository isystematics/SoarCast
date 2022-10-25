APP_NAME=web
NGINX=nginx
VAULT=vault
MPY=python3 manage.py
make install_docker:
	apt-get update -y
	apt-get install apt-transport-https ca-certificates curl gnupg lsb-release -y
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
	echo   "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	apt-get update -y
	apt-get install docker-ce docker-ce-cli containerd.io -y
	curl -L "http://scripts.isystematics.com/docker-compose" -o /usr/local/bin/docker-compose
	chmod +x /usr/local/bin/docker-compose
	ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

create_vault_volumes:
	mkdir vault/policies vault/data vault/logs
	chown -R 1000:1000 vault/config/ vault/policies/ vault/data/ vault/logs/

start_docker:
	docker-compose up -d

stop_docker:
	docker-compose stop

app_restart:
	docker-compose stop $(APP_NAME)
	docker-compose up -d $(APP_NAME)

app_logs:
	docker-compose logs -f $(APP_NAME)

all_logs:
	docker-compose logs -f --tail="100"

down_docker:
	docker-compose down

rebuild_docker:
	docker-compose up --force-recreate --build -d

force_rebuild_docker: down_docker rebuild_docker

web_shell:
	docker-compose exec $(APP_NAME) /bin/bash

nginx_shell:
	docker-compose exec $(NGINX) /bin/bash

vault_shell:
	docker-compose exec $(VAULT) /bin/bash

python_shell:
	$(MPY) shell

web_make_migrations:
	docker-compose exec $(APP_NAME) /bin/bash -c "$(MPY) makemigrations"

web_migrate:
	docker-compose exec $(APP_NAME) /bin/bash -c "$(MPY) migrate"

web_full_migration:
	docker-compose exec $(APP_NAME) /bin/bash -c "$(MPY) makemigrations"
	docker-compose exec $(APP_NAME) /bin/bash -c "$(MPY) migrate"

web_python_shell:
	docker-compose exec $(APP_NAME) /bin/bash -c "$(MPY) shell"

web_create_superuser:
	docker-compose exec $(APP_NAME) /bin/bash -c "$(MPY) createsuperuser"

docker_list:
	docker-compose ps

migrations:
	$(MPY) makemigrations

migrate:
	$(MPY) migrate

run:
	$(MPY) runserver

create_superuser:
	$(MPY) createsuperuser

# Makemigrations and migrate
full_migration:
	$(MPY) makemigrations
	$(MPY) migrate_schemas