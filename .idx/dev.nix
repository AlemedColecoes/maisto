{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [ pkgs.nodejs_20 ];
  idx = {
    workspace = {
      onStart = {
        npm-install = "npm install";
        build-css = "npm run build-css";
        build-js = "npm run build-js";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["node" "server.js" "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
