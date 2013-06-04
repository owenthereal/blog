#
# WATCH LESS FILES
#
watch:
	echo "Watching less files..."; \
	watchr -e "watch('less/.*\.less') { system 'lessc -x less/styles.less > css/styles.css && echo \"Compiled to css/styles.css\"' }"

.PHONY: watch
