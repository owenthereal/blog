require 'yaml'

POST_FOLDER = File.join(File.expand_path(File.dirname(__FILE__)), "posts")
MAN_VARIABLES = ["title"]
VARIABLES = MAN_VARIABLES + ["layout", "category", "tags", "permalink", "published", "date", "content"]

class String
  def separate
    self.split(/_+|,\s*|\s+/).map{ |t| t.strip }
  end
end

class FrontMatter
  DEFAULT_FRONT_MATTER_VARIABLES = {"layout" => "post"}

  def initialize(front_matter_variables)
    # normalize the title
    front_matter_variables["title"] = front_matter_variables["title"].downcase.separate.map{ |t| t.capitalize }.join(" ") if front_matter_variables["title"]

    # normalize the category
    front_matter_variables["category"] = front_matter_variables["category"].separate[0] if front_matter_variables["category"]

    # normalize the tags 
    front_matter_variables["tags"] = front_matter_variables["tags"].separate.join(" ") if front_matter_variables["tags"]

    # merging variables
    @front_matter_variables = DEFAULT_FRONT_MATTER_VARIABLES.merge(front_matter_variables)
  end

  def each
    @front_matter_variables.each { |k, v| yield(k, v) }
  end

  def [](k)
    @front_matter_variables[k]
  end

  def to_s
    str = "Front matter variables:\n"
    @front_matter_variables.each { |k, v| str += "#{k}: #{v}\n"}
    str
  end
end

class Post
  attr_accessor :post_file, :front_matter, :content

  def initialize(post_file, front_matter_variables, content)
    @post_file = post_file
    @front_matter = FrontMatter.new(front_matter_variables)
    @content = content
  end

  def save
    post_folder = File.dirname(@post_file)
    mkdir_p(post_folder)
    File.open(@post_file, "w") do |f| 
      f.puts "---\n"
      @front_matter.each do |k, v|
        f.puts "#{k}: #{v}\n"
      end
      f.puts "---\n\n"
      f.puts @content
    end
  end

  def to_s
    @post_file
  end

  def self.create(front_matter_variables, content)
    unless front_matter_variables["title"]
      raise "Error occured when creating a post: title can't be nil."
    end
    front_matter_variables["category"] ||= "uncategorized"

    post_date = Time.new.strftime("%Y-%m-%d")
    post_title = front_matter_variables["title"].downcase.separate
    post_file_name = post_date + "-" + post_title.join("-") +".markdown"
    post_file = File.join(POST_FOLDER, front_matter_variables["category"], "_posts", post_file_name)
    Post.new(post_file, front_matter_variables, content)
  end

  def self.find(title, category=nil)
    unless title
      raise "Error occured when finding a post: title can't be nil."
    end

    post_folder_to_find = File.join(POST_FOLDER, "**")

    if category
      category = category.separate[0]
      post_folder_to_find = File.join(post_folder_to_find, category, "**")
    end

    # change the title to the format of a post file name
    title = title.downcase.separate.join("-")
    post_file_to_find = File.join(post_folder_to_find, "*#{title}*.markdown")

    found_posts = []
    Dir.glob(post_file_to_find).each do |p|
      file_content = File.read(p)

      front_matter = {}
      content = ""
      if file_content =~ /^(---\s*\n.*?\n?)^(---\s*$\n?)/m
        content = file_content[($1.size + $2.size)..-1]
        front_matter = YAML.load($1)
      end

      found_posts << Post.new(p, front_matter, content)
    end

    found_posts
  end
end

namespace :post do
  desc "Create a post with the specified front matter. "
  task :create do
    # default value is empty string
    variables = Hash.new("")

    VARIABLES.each do |k|
      variables[k] = ENV[k] if ENV.has_key?(k)
    end

    content = variables.delete("content")
    post = Post.create(variables, content)
    post.save

    puts "Created post #{post.post_file}" 
  end

  desc "Remove a post with the specified title."
  task :remove do
    puts ENV["-f"]
    found_posts = Post.find(ENV["title"], ENV["category"])
    puts "Total of posts found with title \"#{ENV["title"]}\": #{found_posts.size}\n"
    found_posts.each do |p|
      print "Are you sure to remove post #{p}? (y/n): "
      confirm = STDIN.gets.chomp
      if confirm == "y"
        rm_f p.post_file
      end
    end   
  end

  desc "Find a post with the specified title."
  task :find do
    found_posts = Post.find(ENV["title"], ENV["category"])
    puts "Total of posts found with title \"#{ENV["title"]}\": #{found_posts.size}\n"
    found_posts.each { |p| puts p }
  end
end