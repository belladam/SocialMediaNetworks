class Comment {
    constructor(username, content, createdAt) {
      this.username = username;
      this.content = content;
      this.createdAt = new Date(createdAt);
    }
  }
  
  class Post {
    constructor(id, content, createdAt) {
      this.id = id;
      this.content = content;
      this.createdAt = new Date(createdAt);
      this.comments = [];
      this.views = [];
      this.references = [];
    }
  
    addComment(comment) {
      this.comments.push(comment);
    }
  
    addView(view) {
      this.views.push(view);
    }
  
    addReference(postId) {
      this.references.push(postId);
    }
  }
  
  class User {
    constructor(username, attributes) {
      this.username = username;
      this.attributes = attributes;
      this.connections = [];
      this.posts = [];
      this.seenPosts = [];
      this.comments = [];
    }
  
    addConnection(type, target) {
      this.connections.push({ type, target });
    }
  
    addPost(post) {
      this.posts.push(post);
    }
  
    addSeenPost(postId, viewedAt) {
      this.seenPosts.push({ postId, viewedAt: new Date(viewedAt) });
    }
  
    addComment(comment) {
      this.comments.push(comment);
    }
  }
  
  class SocialMediaNetwork {
    constructor() {
      this.users = [];
    }
  
    addUser(user) {
      this.users.push(user);
    }
  
    findUser(username) {
      return this.users.find(user => user.username === username);
    }
  
    findPost(postId) {
      for (const user of this.users) {
        for (const post of user.posts) {
          if (post.id === postId) {
            return post;
          }
        }
      }
      return null;
    }
  
    generatePostUserGraph(criteria) {
      const graph = {};
      
      this.users.forEach(user => {
        graph[user.username] = { type: 'user', connections: [] };
        
        user.connections.forEach(conn => {
          graph[user.username].connections.push({
            target: conn.target,
            type: conn.type
          });
        });
  
        user.posts.forEach(post => {
          graph[post.id] = { type: 'post', connections: [], important: false };
          
          graph[user.username].connections.push({
            target: post.id,
            type: 'authored'
          });
  
          post.views.forEach(view => {
            graph[post.id].connections.push({
              target: view.username,
              type: 'viewed'
            });
          });
  
          post.comments.forEach(comment => {
            graph[post.id].connections.push({
              target: comment.username,
              type: 'commented'
            });
          });
  
          // Highlight important posts based on criteria
          if (criteria === 'comments' && post.comments.length > 5) {
            graph[post.id].important = true;
          } else if (criteria === 'views' && post.views.length > 10) {
            graph[post.id].important = true;
          }
        });
      });
  
      return graph;
    }
  
    generateInterestingUsersGraph(criteria) {
      const graph = {};
  
      this.users.forEach(user => {
        graph[user.username] = { type: 'user', connections: [], interesting: false };
  
        user.connections.forEach(conn => {
          graph[user.username].connections.push({
            target: conn.target,
            type: conn.type
          });
        });
  
        // Determine interesting users based on criteria
        if (criteria.posts && user.posts.length > criteria.posts) {
          graph[user.username].interesting = true;
        }
        if (criteria.comments && user.comments.length > criteria.comments) {
          graph[user.username].interesting = true;
        }
        if (criteria.attributes) {
          for (let attr in criteria.attributes) {
            if (user.attributes[attr] === criteria.attributes[attr]) {
              graph[user.username].interesting = true;
            }
          }
        }
      });
  
      return graph;
    }
  
    generateWordCloud(filters) {
      const wordFrequency = {};
  
      this.users.forEach(user => {
        user.posts.forEach(post => {
          if (filters.keywords && !filters.keywords.some(keyword => post.content.includes(keyword))) {
            return;
          }
          if (filters.attributes) {
            for (let attr in filters.attributes) {
              if (user.attributes[attr] !== filters.attributes[attr]) {
                return;
              }
            }
          }
  
          const words = post.content.split(' ');
          words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
        });
      });
  
      return wordFrequency;
    }
  
    generateTrendingPostsReport(filters) {
      const trendingPosts = [];
  
      this.users.forEach(user => {
        user.posts.forEach(post => {
          if (filters.keywords && !filters.keywords.some(keyword => post.content.includes(keyword))) {
            return;
          }
          if (filters.attributes) {
            for (let attr in filters.attributes) {
              if (user.attributes[attr] !== filters.attributes[attr]) {
                return;
              }
            }
          }
  
          const viewRate = post.views.length / (new Date() - post.createdAt);
          const commentRate = post.comments.length / (new Date() - post.createdAt);
          trendingPosts.push({
            post,
            trendScore: viewRate + commentRate
          });
        });
      });
  
      trendingPosts.sort((a, b) => b.trendScore - a.trendScore);
      return trendingPosts;
    }
  
    identifyContentClusters() {
      const clusters = [];
      const visited = new Set();
  
      this.users.forEach(user => {
        user.posts.forEach(post => {
          if (!visited.has(post.id)) {
            const cluster = this.dfs(post, visited);
            clusters.push(cluster);
          }
        });
      });
  
      return clusters;
    }
  
    dfs(post, visited) {
      const stack = [post];
      const cluster = [];
  
      while (stack.length > 0) {
        const currentPost = stack.pop();
        if (!visited.has(currentPost.id)) {
          visited.add(currentPost.id);
          cluster.push(currentPost);
  
          currentPost.references.forEach(refId => {
            const refPost = this.findPost(refId);
            if (refPost && !visited.has(refPost.id)) {
              stack.push(refPost);
            }
          });
        }
      }
  
      return cluster;
    }
  
    identifyUserClusters() {
      const clusters = [];
      const visited = new Set();
  
      this.users.forEach(user => {
        if (!visited.has(user.username)) {
          const cluster = this.dfsUsers(user, visited);
          clusters.push(cluster);
        }
      });
  
      return clusters;
    }
  
    dfsUsers(user, visited) {
      const stack = [user];
      const cluster = [];
  
      while (stack.length > 0) {
        const currentUser = stack.pop();
        if (!visited.has(currentUser.username)) {
          visited.add(currentUser.username);
          cluster.push(currentUser);
  
          currentUser.connections.forEach(conn => {
            const connUser = this.findUser(conn.target);
            if (connUser && !visited.has(connUser.username)) {
              stack.push(connUser);
            }
          });
        }
      }
  
      return cluster;
    }
  
    analyzeDirectionalTrends() {
      const trends = {};
  
      this.users.forEach(user => {
        user.connections.forEach(conn => {
          if (!trends[conn.type]) {
            trends[conn.type] = 0;
          }
          trends[conn.type]++;
        });
      });
  
      return trends;
    }
  }
  
  // Example Usage
  
  // Create users
  const user1 = new User('user1', { realName: 'John Doe', age: 25, gender: 'male', nicknames: ['johnny', 'jdoe'], workplace: 'Company A', location: 'New York' });
  const user2 = new User('user2', { realName: 'Jane Smith', age: 30, gender: 'female', nicknames: ['jane', 'jsmith'], workplace: 'Company B', location: 'San Francisco' });
  
  // Add connections
  user1.addConnection('follows', 'user2');
  
  // Create posts
  const post1 = new Post('post1', 'This is a post by user1', '2024-07-01T12:00:00Z');
  const post2 = new Post('post2', 'This is a post by user2', '2024-07-01T12:00:00Z');
  
  // Add comments and views to posts
  post1.addComment(new Comment('user2', 'Great post!', '2024-07-01T12:30:00Z'));
  post1.addView({ username: 'user2', viewedAt: '2024-07-01T12:10:00Z' });
  
  // Add posts to users
  user1.addPost(post1);
  user2.addPost(post2);
  
  // Add seen posts to users
  user1.addSeenPost('post2', '2024-07-01T13:00:00Z');
  
  // Create social media network and add users
  const network = new SocialMediaNetwork();
  network.addUser(user1);
  network.addUser(user2);
  
  // Generate graphs and reports
  const postUserGraph = network.generatePostUserGraph('comments');
  const interestingUsersGraph = network.generateInterestingUsersGraph({ posts: 1, comments: 1 });
  const wordCloud = network.generateWordCloud({ keywords: ['post'], attributes: { location: 'New York' } });
  const trendingPosts = network.generateTrendingPostsReport({ keywords: ['post'], attributes: { location: 'San Francisco' } });
  
  // Identify clusters of content
  const contentClusters = network.identifyContentClusters();
  
  // Identify clusters of users
  const userClusters = network.identifyUserClusters();
  
  // Analyze directional trends in network usage
  const directionalTrends = network.analyzeDirectionalTrends();
  
  console.log(postUserGraph);
  console.log(interestingUsersGraph);
  console.log(wordCloud);
  console.log(trendingPosts);
  console.log(contentClusters);
  console.log(userClusters);
  console.log(directionalTrends);
  