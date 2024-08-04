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
          if (criteria === 'comments' && post.comments.length > 3) {
            graph[post.id].important = true;
          } else if (criteria === 'views' && post.views.length > 4) {
            graph[post.id].important = true;
          } else if (criteria === 'blend' && (post.comments.length > 2 || post.views.length > 3)) {
            graph[post.id].important = true;
          }
        });
      });

      return graph;
    }

    renderPostUserGraph(graph) {
      const nodesArray = [];
      const edgesArray = [];

      Object.keys(graph).forEach(nodeId => {
        const node = graph[nodeId];

        let nodeOptions = { id: nodeId, label:nodeId };
        if (node.type === 'post') {
          nodeOptions.color = node.important ? 'lightcoral' : 'lightgray';
          nodeOptions.shape = 'box';
        } else {
          nodeOptions.color = 'cornflowerblue';
        }
        nodesArray.push(nodeOptions);

        node.connections.forEach(conn => {
          edgesArray.push({
            from: nodeId,
            to: conn.target,
            arrows: 'to',
            color: conn.type === 'authored' ? 'blue' : 'green'
          });
        });
      });

      const nodes = new vis.DataSet(nodesArray);
      const edges = new vis.DataSet(edgesArray);

      const container = document.getElementById('graph');
      const data = {
        nodes: nodes,
        edges: edges
      };
      const options = {};

      new vis.Network(container, data, options);
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
  const user1 = new User('user1', { realName: 'John Doe', age: 25, gender: 'male', nicknames: ['johnny', 'doe'], workplace: 'Company A', location: 'New York' });
  const user2 = new User('user2', { realName: 'Jane Smith', age: 30, gender: 'female', nicknames: ['jane', 'smith'], workplace: 'Company B', location: 'San Francisco' });
  const user3 = new User('user3', { realName: 'Alice Johnson', age: 28, gender: 'female', nicknames: ['alice', 'johnson'], workplace: 'Company C', location: 'Chicago' });
  const user4 = new User('user4', { realName: 'Bob Brown', age: 35, gender: 'male', nicknames: ['bob', 'brown'], workplace: 'Company D', location: 'Seattle' });
  const user5 = new User('user5', { realName: 'Carol Davis', age: 22, gender: 'female', nicknames: ['carol', 'davis'], workplace: 'Company E', location: 'Los Angeles' });
  const user6 = new User('user6', { realName: 'David Wilson', age: 40, gender: 'male', nicknames: ['dave', 'wilson'], workplace: 'Company F', location: 'Boston' });


// Add connections
  user1.addConnection('follows', 'user2');
  user1.addConnection('follows', 'user3');
  user2.addConnection('follows', 'user4');
  user2.addConnection('follows', 'user5');
  user3.addConnection('follows', 'user4');
  user3.addConnection('follows', 'user6');
  user4.addConnection('follows', 'user1');
  user4.addConnection('follows', 'user5');
  user5.addConnection('follows', 'user6');
  user6.addConnection('follows', 'user2');
  
  // Create posts
  const post1 = new Post('post1', 'This is a post by user1', '2024-07-01T12:00:00Z');
  const post2 = new Post('post2', 'This is a post by user2', '2024-07-01T12:00:00Z');
  const post3 = new Post('post3', 'This is a post by user2', '2024-07-01T12:00:00Z');
  const post4 = new Post('post4', 'This is a post by user4', '2024-07-01T12:00:00Z');
  const post5 = new Post('post5', 'This is a post by user5', '2024-07-01T12:00:00Z');
  const post6 = new Post('post6', 'This is a post by user5', '2024-07-01T12:00:00Z');
  
  // Add comments and views to posts
// Post 1
post1.addComment(new Comment('user2', 'Great post!', '2024-07-01T12:30:00Z'));
post1.addComment(new Comment('user3', 'Very insightful, thanks!', '2024-07-01T13:00:00Z'));
post1.addComment(new Comment('user4', 'I learned a lot from this.', '2024-07-01T14:00:00Z'));
post1.addView({ username: 'user2', viewedAt: '2024-07-01T12:10:00Z' });
post1.addView({ username: 'user3', viewedAt: '2024-07-01T13:05:00Z' });
post1.addView({ username: 'user4', viewedAt: '2024-07-01T14:10:00Z' });
post1.addView({ username: 'user5', viewedAt: '2024-07-01T14:20:00Z' });

// Post 2
post2.addComment(new Comment('user1', 'I disagree with this point.', '2024-07-02T08:20:00Z'));
post2.addComment(new Comment('user4', 'Interesting perspective.', '2024-07-02T09:45:00Z'));
post2.addComment(new Comment('user6', 'Can you provide more details?', '2024-07-02T10:30:00Z'));
post2.addView({ username: 'user1', viewedAt: '2024-07-02T08:00:00Z' });
post2.addView({ username: 'user4', viewedAt: '2024-07-02T09:30:00Z' });

// Post 3
post3.addComment(new Comment('user5', 'This helped me a lot, thanks!', '2024-07-03T10:15:00Z'));
post3.addComment(new Comment('user6', 'I found this very useful.', '2024-07-03T11:00:00Z'));
post3.addComment(new Comment('user1', 'Excellent post!', '2024-07-03T11:45:00Z'));
post3.addView({ username: 'user5', viewedAt: '2024-07-03T10:00:00Z' });
post3.addView({ username: 'user6', viewedAt: '2024-07-03T11:05:00Z' });

// Post 4
post4.addComment(new Comment('user3', 'Not sure I agree with this.', '2024-07-04T14:20:00Z'));
post4.addComment(new Comment('user5', 'Could you elaborate more?', '2024-07-04T15:30:00Z'));
post4.addView({ username: 'user3', viewedAt: '2024-07-04T14:00:00Z' });
post4.addView({ username: 'user5', viewedAt: '2024-07-04T15:00:00Z' });

// Post 5
post5.addComment(new Comment('user1', 'Very informative post.', '2024-07-05T09:00:00Z'));
post5.addComment(new Comment('user2', 'Thanks for sharing this!', '2024-07-05T09:30:00Z'));
post5.addView({ username: 'user1', viewedAt: '2024-07-05T08:50:00Z' });
post5.addView({ username: 'user2', viewedAt: '2024-07-05T09:20:00Z' });
post5.addView({ username: 'user4', viewedAt: '2024-07-05T09:40:00Z' });

// Post 6
post6.addComment(new Comment('user4', 'I found this article quite helpful.', '2024-07-06T16:45:00Z'));
post6.addComment(new Comment('user6', 'Great job on this post.', '2024-07-06T17:15:00Z'));
post6.addComment(new Comment('user1', 'Well done!', '2024-07-06T17:45:00Z'));
post6.addView({ username: 'user4', viewedAt: '2024-07-06T16:30:00Z' });
post6.addView({ username: 'user6', viewedAt: '2024-07-06T17:00:00Z' });



// Add posts to users
  user1.addPost(post1);
  user2.addPost(post2);
  user2.addPost(post3);
  user4.addPost(post4);
  user5.addPost(post5);
  user5.addPost(post6);
  
  // Add seen posts to users
// Sample data for user1
user1.addSeenPost('post2', '2024-07-01T13:00:00Z');
user1.addSeenPost('post4', '2024-07-01T13:00:00Z');
user1.addSeenPost('post6', '2024-07-01T13:00:00Z');

// Sample data for user2
user2.addSeenPost('post1', '2024-07-02T09:30:00Z');
user2.addSeenPost('post3', '2024-07-02T09:30:00Z');
user2.addSeenPost('post5', '2024-07-03T15:00:00Z');

// Sample data for user3
user3.addSeenPost('post1', '2024-07-01T14:00:00Z');
user3.addSeenPost('post2', '2024-07-02T10:00:00Z');
user3.addSeenPost('post4', '2024-07-03T11:30:00Z');

// Sample data for user4
user4.addSeenPost('post3', '2024-07-01T12:00:00Z');
user4.addSeenPost('post5', '2024-07-02T08:00:00Z');
user4.addSeenPost('post6', '2024-07-02T16:00:00Z');

// Sample data for user5
user5.addSeenPost('post2', '2024-07-01T15:00:00Z');
user5.addSeenPost('post4', '2024-07-03T10:00:00Z');
user5.addSeenPost('post6', '2024-07-04T12:00:00Z');

// Sample data for user6
user6.addSeenPost('post1', '2024-07-03T09:00:00Z');
user6.addSeenPost('post3', '2024-07-04T14:00:00Z');
user6.addSeenPost('post5', '2024-07-05T11:00:00Z');

  
  // Create social media network and add users
  const network = new SocialMediaNetwork();
  network.addUser(user1);
  network.addUser(user2);
  network.addUser(user3);
  network.addUser(user4);
  network.addUser(user5);
  network.addUser(user6);

  
  // Generate graphs and reports
  const postUserGraph = network.generatePostUserGraph('blend');
  const interestingUsersGraph = network.generateInterestingUsersGraph({ posts: 1, comments: 1 });
  const wordCloud = network.generateWordCloud({ keywords: ['post'], attributes: { location: 'New York' } });
  const trendingPosts = network.generateTrendingPostsReport({ keywords: ['post'], attributes: { location: 'San Francisco' } });

  // Rendering Graphs
  network.renderPostUserGraph(postUserGraph);

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
