{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20,  # Adding Node.js to the environment
    pkgs.firebase-tools # Adding firebase-tools to the environment
  ];
  
  # Sets environment variables in the workspace
  env = {};
  
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "dbaeumer.vscode-eslint" # Recommended for JavaScript/Node.js development
    ];
    
    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Use $PORT which is auto-assigned. 
          # The -- is to make sure --port is passed to the script not npm
          command = ["npm" "run" "dev" "--" "--port" "$PORT"];
          manager = "web";
        };
      };
    };
    
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        npm-install = "npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # dev-server = "npm run dev"; # This is redundant and has been removed
      };
    };
  };
}
