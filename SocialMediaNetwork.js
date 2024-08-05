/* Assignment 5 - Social Media Network Diagrams
 * @author Adam Bell
 * @author Ben Crawford
 * @author Tim Lum
 *
 * For the graph representations in our html document, we used Vis.js libraries.
 */

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
    }
  
    addComment(comment) {
      this.comments.push(comment);
    }
  
    addView(view) {
      this.views.push(view);
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
  }
  
  class SocialMediaNetwork {
    constructor() {
      this.users = [];
    }

    addUser(user) {
      this.users.push(user);
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
          if (criteria === 'comments' && post.comments.length > 2) {
            graph[post.id].important = true;
          } else if (criteria === 'views' && post.views.length > 3) {
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
        const nodeOptions = { id: nodeId, label: nodeId };
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

      const container = document.getElementById('graph1');
      const data = { nodes: nodes, edges: edges };
      const options = {};

      new vis.Network(container, data, options);
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

    renderWordCloud(wordFrequency) {
      const nodes = Object.keys(wordFrequency).map((word, index) => {
        return {
          id: index + 1,
          label: word,
          value: wordFrequency[word],
          font: {
            size: wordFrequency[word] * 10
          }
        }
      });

      const data = {
        nodes: new vis.DataSet(nodes),
        edges: []
      };

      const options = {
        nodes: {
          shape: 'dot',
        }
      }
      const container = document.getElementById('graph2');
      new vis.Network(container, data, options);
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
            trendScore: (viewRate + commentRate) * 1_000_000
          });
        });
      });

      trendingPosts.sort((a, b) => b.trendScore - a.trendScore);
      return trendingPosts;
    }

    renderTrendingPosts(trendingPosts) {
      const container = document.getElementById("graph3");
      const textContainer = document.getElementById("graph3Text");
      textContainer.innerHTML = trendingPosts.map(tp => `<div style="padding: 10px">${tp.post.id}</div>`).join('');

      const nodes = trendingPosts.map((tp, index) => {
        return {
          x: index + 1,
          y: tp.trendScore,
          label: { content: tp.post.id }
        };
      });
      const options = {
        style: 'bar',
        barChart: { width: 50, align: 'center' },
        drawPoints: false,
        dataAxis: {
          left: {
            range: {
              min: 0,
            },
            title: {
              text: "Trend Score"
            },
          },
        },
        showMajorLabels: false,
        showMinorLabels: false,
        orientation: "top",
        height: '400px',
        start: 0,
        end: 5,
        clickToUse: true,
      };
      new vis.Graph2d(container, nodes, options);
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
  const post1 = new Post('post1', 'This is is is a a post by by by by user1', '2024-08-03T12:00:00Z');
  const post2 = new Post('post2', 'This is a post by user2', '2024-08-03T12:00:00Z');
  const post3 = new Post('post3', 'This is a post by user2', '2024-08-03T12:00:00Z');
  const post4 = new Post('post4', 'This is a post by user4 Hello', '2024-08-03T12:00:00Z');
  const post5 = new Post('post5', 'This is a post by user5 Hello World', '2024-08-03T12:00:00Z');
  const post6 = new Post('post6', 'This is a post by user5 Hello World', '2024-08-03T12:00:00Z');
  
  // Add comments and views to posts
// Post 1
post1.addComment(new Comment('user2', 'Great post!', '2024-07-01T12:30:00Z'));
post1.addComment(new Comment('user3', 'Very insightful, thanks!', '2024-07-01T13:00:00Z'));
post1.addComment(new Comment('user4', 'I learned a lot from this.', '2024-07-01T14:00:00Z'));
post1.addComment(new Comment('user3', 'I disagree with this point.', '2024-07-02T08:20:00Z'));
post1.addComment(new Comment('user6', 'Can you provide more details?', '2024-07-02T10:30:00Z'));
post1.addView({ username: 'user2', viewedAt: '2024-07-01T12:10:00Z' });
post1.addView({ username: 'user3', viewedAt: '2024-07-01T13:05:00Z' });
post1.addView({ username: 'user4', viewedAt: '2024-07-01T14:10:00Z' });
post1.addView({ username: 'user5', viewedAt: '2024-07-01T14:20:00Z' });

// Post 2
post2.addComment(new Comment('user1', 'I disagree with this point.', '2024-07-02T08:20:00Z'));
post2.addComment(new Comment('user4', 'Interesting perspective.', '2024-07-02T09:45:00Z'));
post2.addComment(new Comment('user6', 'Can you provide more details?', '2024-07-02T10:30:00Z'));
post2.addComment(new Comment('user4', 'I learned a lot from this.', '2024-07-01T14:00:00Z'));
post2.addView({ username: 'user1', viewedAt: '2024-07-02T08:00:00Z' });
post2.addView({ username: 'user4', viewedAt: '2024-07-02T09:30:00Z' });
post2.addView({ username: 'user6', viewedAt: '2024-07-02T09:30:00Z' });

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
  // For different importance, pass 'comments' , 'views' , or 'blend'.
  const postUserGraph = network.generatePostUserGraph('blend');
  // For different filters, pass keywords[keyword1, keyword2, etc.] as the first argument, and/or pass attributes{location: 'New York', workplace: 'Company A'}
  const wordCloud = network.generateWordCloud({ keywords: ['post']/*, attributes: { location: 'New York' }*/ });
  const trendingPosts = network.generateTrendingPostsReport({ keywords: ['post']});

  // Rendering Graphs
  network.renderPostUserGraph(postUserGraph);
  network.renderWordCloud(wordCloud);
  network.renderTrendingPosts(trendingPosts);

  /*
  console.log(postUserGraph);
  console.log(wordCloud);
  console.log(trendingPosts);
*/
