import { type NextRequest } from 'next/server';

type Variables = {
    first: number;
    queryString?: string;
    after?: string;
    issueId?: string | null;
};

type GitHubIssue = {
  id: string;
  number: number;
  title: string;
  author?: {
    login: string;
  } | null;
  comments: {
    totalCount: number;
  };
}

type IssueEdge = {
  node: GitHubIssue;
}

type IssueData = {
  id: string;
  number: number;
  author: string;
  title: string;
  children: boolean;
  remoteChildCount: number;
}

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author?: {
    login: string;
  } | null;
}

type CommentEdge = {
  node: Comment;
}

type MappedComment = {
  id: string;
  author: string;
  title: string;
}


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const count = searchParams.get('count');
    const filters = searchParams.get('filters');
    const endCursor = searchParams.get('endCursor');
    const commentEndCursor = searchParams.get('commentEndCursor');
    const parentId = searchParams.get('parentId');

    if (!count) {
        return Response.json({
            success : false,
            message : 'Missing count parameter'
        }, {
            status : 400
        });
    }

    const githubRepoOwner = 'microsoft';
    const githubRepoName = 'vscode';

    let query = '';
    const variables: Variables = {
        first : parseInt(count) || 100
    };

    const baseQuery = `repo:${githubRepoOwner}/${githubRepoName} is:issue`;
    variables.queryString = baseQuery;

    // Filter issues
    if (filters && parentId === 'root') {
        const parsedFilter = JSON.parse(filters);
        const filterObj = parsedFilter[0];
        if (filterObj.field === 'title' && filterObj.operator === 'includes') {
            variables.queryString += ` ${filterObj.value} in:${filterObj.field}`;
        }

        // Use endCursor if valid; otherwise, start fresh
        const effectiveEndCursor = (endCursor && endCursor !== 'null' && endCursor !== 'undefined')
            ? endCursor
            : null;

        if (effectiveEndCursor) {
            variables.after = effectiveEndCursor;
        }

        query = `
          query ($queryString: String!, $first: Int!, $after: String) {
            search(query: $queryString, type: ISSUE, first: $first, after: $after) {
              issueCount
              edges {
                node {
                  ... on Issue {
                    id
                    number
                    title
                    author {
                      login
                    }
                    comments {
                      totalCount
                    }
                  }
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
      `;

        try {
            const response = await fetch('https://api.github.com/graphql', {
                method  : 'POST',
                headers : {
                    'Content-Type'  : 'application/json',
                    'Authorization' : `bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
                },
                body : JSON.stringify({ query, variables })
            });

            const rawData = await response.json();
            const issues = rawData.data.search;
            let newEndCursor = null;

            if (issues.pageInfo.hasNextPage) {
                newEndCursor = issues.pageInfo.endCursor;
            }

            const data: IssueData[] = issues.edges.map((edge: IssueEdge): IssueData => {
                const issue: GitHubIssue = edge.node;
                return {
                    id               : issue.id,
                    number           : issue.number,
                    author           : issue?.author ? issue.author.login : 'Unknown',
                    title            : issue.title,
                    children         : issue.comments.totalCount > 0,
                    remoteChildCount : issue.comments.totalCount
                };
            });

            return Response.json({
                data,
                total     : issues.issueCount,
                endCursor : newEndCursor
            });
        }
        catch (error) {
            console.error(error);
            return Response.json({
                success : false,
                message : 'Failed to fetch issues'
            }, {
                status : 400
            });
        }
    }

    // Lazyload issues
    if (!filters && parentId === 'root') {
        const afterStr = endCursor !== 'null' && endCursor !== 'undefined' ? `${endCursor}` : '';
        variables.after = afterStr;
        query = `
          query ($first: Int!, $after: String) {
            repository(owner: "${githubRepoOwner}", name: "${githubRepoName}") {
              issues(first: $first, after: $after) {
                totalCount
                edges {
                  node {
                    id
                    author {
                      login
                    }
                    number
                    title
                    comments {
                      totalCount
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        `;

        try {
            const response = await fetch('https://api.github.com/graphql', {
                method  : 'POST',
                headers : {
                    'Content-Type'  : 'application/json',
                    'Authorization' : `bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
                },
                body : JSON.stringify({ query, variables })
            });

            const rawData = await response.json();

            const issues = rawData.data.repository.issues;
            let newEndCursor = null;
            if (issues.pageInfo.hasNextPage) {
                newEndCursor = issues.pageInfo.endCursor;
            }

            const data: IssueData[] = issues.edges.map((edge: IssueEdge): IssueData => {
                const issue: GitHubIssue = edge.node;
                return {
                    id               : issue.id,
                    number           : issue.number,
                    author           : issue?.author ? issue.author.login : 'Unknown',
                    title            : issue.title,
                    children         : issue.comments.totalCount > 0,
                    remoteChildCount : issue.comments.totalCount
                };
            });

            return Response.json({
                data,
                total     : issues.totalCount,
                endCursor : newEndCursor
            });
        }

        catch (error) {
            console.error(error);
            return Response.json({
                success : false,
                message : 'Failed to fetch issues'
            }, {
                status : 400
            });
        }
    }

    // Dynamically load comments
    if (parentId !== 'root') {
        variables.issueId = parentId;
        // Use commentEndCursor if valid; otherwise, start fresh
        const effectiveCommentEndCursor = (commentEndCursor && commentEndCursor !== 'null' && commentEndCursor !== 'undefined')
            ? commentEndCursor
            : null;

        if (effectiveCommentEndCursor) {
            variables.after = effectiveCommentEndCursor;
        }

        query = `
          query ($issueId: ID!, $first: Int!, $after: String) {
            node(id: $issueId) {
              ... on Issue {
                comments(first: $first, after: $after) {
                  totalCount
                  edges {
                    node {
                      id
                      body
                      createdAt
                      author {
                        login
                      }
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }
      `;

        try {
            const response = await fetch('https://api.github.com/graphql', {
                method  : 'POST',
                headers : {
                    'Content-Type'  : 'application/json',
                    'Authorization' : `bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
                },
                body : JSON.stringify({ query, variables })
            });

            const rawData = await response.json();

            const comments = rawData.data.node.comments;

            let newCommentEndCursor = null;
            if (comments.pageInfo.hasNextPage) {
                newCommentEndCursor = comments.pageInfo.endCursor;
            }

            const data: MappedComment[] = comments.edges.map((edge: CommentEdge): MappedComment => {
                const comment: Comment = edge.node;
                return {
                    id     : comment.id,
                    author : comment?.author ? comment.author?.login : 'Unknown',
                    title  : comment.body
                };
            });

            return Response.json({
                data,
                commentEndCursor : newCommentEndCursor
            });
        }

        catch (error) {
            console.error(error);
            return Response.json({
                success : false,
                message : 'Failed to fetch comments'
            }, {
                status : 400
            });
        }
    }
}
