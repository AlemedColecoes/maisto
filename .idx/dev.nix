{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [ pkgs.nodejs_20 ];
  idx = {
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          # Execute the server directly, passing the IDX port as a command-line argument.
          command = ["node" "server.js" "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
