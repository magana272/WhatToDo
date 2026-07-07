SHELL := /bin/bash
.PHONY: dev build clean run start

export NVM_DIR := $(HOME)/.nvm
NVM := source "$(NVM_DIR)/nvm.sh" && nvm use 24 &&

clean: 
	rm -rf .next
run: clean
	$(NVM) npm run build && npm run start