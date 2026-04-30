async function loadBlogIndex() {
    toggleView('blog-index');
    const response = await fetch('posts.json');
    const posts = await response.json();
    
    const list = document.getElementById('post-list');
    list.innerHTML = posts.map(post => `
        <div class="post-card" onclick="loadPost('${post.slug}')">
            <span>${post.date}</span>
            <h2>${post.title}</h2>
            <p>${post.summary}</p>
        </div>
    `).join('');
}

async function loadPost(slug) {
    toggleView('post-view');
    try {
        const response = await fetch(`posts/${slug}.md`);
        const markdown = await response.text();
        // Use Marked.js to convert Markdown to HTML
        document.getElementById('post-content').innerHTML = marked.parse(markdown);
    } catch (err) {
        document.getElementById('post-content').innerHTML = "Post not found.";
    }
}

function toggleView(viewId) {
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('blog-index').classList.add('hidden');
    document.getElementById('post-view').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}