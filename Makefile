# ----- COLORS -----
ON_BLUE = \033[44m
ON_CYAN = \033[46m
ON_GREEN = \033[42m
ON_PURPLE = \033[45m
BBLUE = \033[1;34m
BCYAN = \033[1;36m
BGREEN = \033[1;32m
BLUE = \033[0;34m
CYAN = \033[0;36m
PURPLE = \033[0;35m
EOC = \033[m
# ------------------


# ----- SOURCE FILES -----
YAML = docker-compose.yml
# ------------------------

all: build

# ----- DEBUG RULES -----

ifeq (debug,$(firstword $(MAKECMDGOALS)))
  # use the rest as arguments for "debug"
  DEBUG_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # ...and turn them into do-nothing targets
  $(eval $(DEBUG_ARGS):;@:)
endif

debug:
	docker compose -f $(YAML) exec $(DEBUG_ARGS) bash

# ------------------------

# ----- DOCKER LISTS RULES -----

images:
	@echo "$(ON_BLUE)- Docker Images List: -$(EOC)"
	@docker images

ps:
	@echo "$(ON_PURPLE)- Docker Containers List: -$(EOC)"
	@docker ps -a

volumes:
	@echo "$(ON_PURPLE)- Docker Volumes List: -$(EOC)"
	@docker volume ls

# ------------------------------


# ----- MANDATORY PART RULES -----

build:
	@echo "$(ON_GREEN)- Running ft_transcendence ... -$(EOC)"
	@docker compose -f $(YAML) up --build
	@echo "$(BCYAN)---> ft_transcendence running: [DONE]$(EOC)"

down: 
	@echo "$(ON_GREEN)- Putting down ft_transcendence... -$(EOC)"
	@docker compose -f $(YAML) down
	@echo "$(BCYAN)---> Putting ft_transcendence down: [OK]$(EOC)"

rm:
	@echo "$(ON_PURPLE)- Removing all containers... -$(EOC)"
	@docker rm -f $$(docker ps -aq) 2> /dev/null || true
	@echo "$(BCYAN)---> ft_transcendence containers removing: [DONE]$(EOC)"
 
rmi:
	@echo "$(ON_BLUE)- Removing all images... -$(EOC)"
	@docker rmi -f $$(docker images -aq) 2> /dev/null || true
	@echo "$(BCYAN)---> Images removing: [DONE]$(EOC)"
	
stop: 
	@echo "$(ON_GREEN)- Stopping ft_transcendence... -$(EOC)"
	@docker compose -f $(YAML) stop -t 2
	@echo "$(BCYAN)---> ft_transcendence stopped: [OK]$(EOC)"

clean: stop down
	@docker volume rm $$(docker volume ls -q) 2> /dev/null || true
	@echo "$(BCYAN)ft_transcendence containers, networks and volumes removed: [OK]$(EOC)"

fclean: clean 
	@echo "$(ON_GREEN)- Wiping out every traces of ft_transcendence... -$(EOC)"
	@docker system prune -a --volumes -f
	@echo "$(BCYAN)No more ft_transcendence: [DONE]$(EOC)"

re: clean rm rmi all

# ---------------------------------

.PHONY: all debug images ps volumes up down rm rmi clean fclean re
