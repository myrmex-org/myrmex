# Use ubuntu:latest as base image.
FROM ubuntu:latest

MAINTAINER Alexis N-o "alexis@henaut.net"

ENV NODE_VERSION=4.3.2
ENV USERNAME=lager

# Install useful packages for a Node.js development environment
RUN apt-get update &&\
    apt-get install -y software-properties-common python-software-properties python g++ make zsh curl wget git unzip vim telnet &&\
    apt-get clean && rm -rf /var/lib/apt/lists/* &&\
    cd /opt &&\
    wget https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz &&\
    tar xvzf node-v${NODE_VERSION}-linux-x64.tar.gz &&\
    ln -s /opt/node-v${NODE_VERSION}-linux-x64/bin/node /usr/local/bin/node &&\
    ln -s /opt/node-v${NODE_VERSION}-linux-x64/bin/npm /usr/local/bin/npm

# Install oh-my-zsh and define zsh as default shell
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh || true &&\
    chsh -s /bin/zsh

# Apply custom theme, disable auto-update and fix backspace displaying space in the prompt
COPY /.oh-my-zsh/themes/lager.zsh-theme /root/.oh-my-zsh/themes/lager.zsh-theme
RUN sed -i 's/ZSH_THEME="robbyrussell"/ZSH_THEME="lager"/g' /root/.zshrc &&\
    sed -i 's/# DISABLE_AUTO_UPDATE=true/DISABLE_AUTO_UPDATE=true/g' /root/.zshrc &&\
    echo TERM=xterm >> /root/.zshrc

# Create user "lager"
RUN useradd $USERNAME -m -d /home/$USERNAME/ -s /bin/zsh -G sudo && passwd -d -u $USERNAME

# Add a script to modify the UID / GID for user "lager"
COPY /usr/local/bin/change-uid /usr/local/bin/change-uid
RUN chmod +x /usr/local/bin/change-uid

# Configure zsh and git for user "lager"
USER $USERNAME
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh || true &&\
    sed -i 's/ZSH_THEME="robbyrussell"/ZSH_THEME="lager"/g' /home/$USERNAME/.zshrc &&\
    sed -i 's/# DISABLE_AUTO_UPDATE=true/DISABLE_AUTO_UPDATE=true/g' /home/$USERNAME/.zshrc &&\
    echo TERM=xterm >> /home/$USERNAME/.zshrc
COPY /.oh-my-zsh/themes/lager.zsh-theme /home/$USERNAME/.oh-my-zsh/themes/lager.zsh-theme

# Setup to install npm packages globally with user lager
RUN echo "prefix = ~/.node" >> ~/.npmrc &&\
    echo "export PATH=$PATH:/home/$USERNAME/.node/bin/" >> ~/.zshrc
ENV PATH $PATH:/home/$USERNAME/.node/bin/

# Create a directory to share the application sources
RUN mkdir /home/$USERNAME/app

WORKDIR /home/$USERNAME/app

CMD ["node"]
