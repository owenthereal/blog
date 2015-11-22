require "rubygems"
require "rake"

namespace :assets do
  desc "Precompile Jekyll site"
  task :precompile do
    sh "jekyll build"

    # Purge all Fastly cache on every asset:precompile if Fastly is set up
    # Hopefully Heroku Deploy Hooks can run a script later
    if ENV["FASTLY_API_KEY"] && ENV["FASTLY_SERVICE_ID"]
      puts "Purging all Fastly cache..."
      sh "curl -s -X POST -H 'Fastly-Key: #{ENV["FASTLY_API_KEY"]}' https://api.fastly.com/service/#{ENV["FASTLY_SERVICE_ID"]}/purge_all"
    end
  end
end
