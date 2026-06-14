/** GitHub REST API helpers for import and Code Studio publish flows. */

export type GitHubRepoSummary = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  private: boolean;
  pushed_at: string | null;
  topics?: string[];
};

export type GitHubFileInput = {
  path: string;
  content: string;
};

function authHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ProjectForge-AI",
  };
  const t = token ?? process.env.GITHUB_TOKEN;
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

async function ghFetch(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
}

export async function listUserRepos(
  username: string,
  token?: string | null,
): Promise<GitHubRepoSummary[]> {
  const repos: GitHubRepoSummary[] = [];
  let page = 1;

  while (page <= 5) {
    const res = await ghFetch(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated`,
      undefined,
      token,
    );
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(
        res.status === 404
          ? `GitHub user "${username}" not found.`
          : `GitHub API error (${res.status}): ${msg.slice(0, 200)}`,
      );
    }
    const batch = (await res.json()) as GitHubRepoSummary[];
    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

export async function listAuthenticatedUserRepos(
  token: string,
): Promise<GitHubRepoSummary[]> {
  const repos: GitHubRepoSummary[] = [];
  let page = 1;

  while (page <= 5) {
    const res = await ghFetch(
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator`,
      undefined,
      token,
    );
    if (!res.ok) {
      throw new Error(`Could not list your GitHub repos (${res.status}).`);
    }
    const batch = (await res.json()) as GitHubRepoSummary[];
    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

export async function getAuthenticatedUser(
  token: string,
): Promise<{ login: string } | null> {
  const res = await ghFetch("/user", undefined, token);
  if (!res.ok) return null;
  const data = (await res.json()) as { login?: string };
  return data.login ? { login: data.login } : null;
}

export async function createRepository(
  token: string,
  name: string,
  description?: string,
  isPrivate = false,
): Promise<{ html_url: string; full_name: string }> {
  const res = await ghFetch(
    "/user/repos",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description: description ?? "",
        private: isPrivate,
        auto_init: false,
      }),
    },
    token,
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      res.status === 422
        ? `Repository "${name}" may already exist on your account.`
        : `Could not create repo (${res.status}): ${err.slice(0, 200)}`,
    );
  }

  const repo = (await res.json()) as { html_url: string; full_name: string };
  return repo;
}

/** Push files to a repo via the Contents API (creates initial commit). */
export async function pushFilesToRepo(
  token: string,
  owner: string,
  repo: string,
  files: GitHubFileInput[],
  commitMessage = "Initial commit from ProjectForge Code Studio",
): Promise<{ commit_url?: string; files_pushed: number }> {
  if (files.length === 0) throw new Error("No files to push.");

  let pushed = 0;
  let lastCommitUrl: string | undefined;

  for (const file of files) {
    const res = await ghFetch(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message:
            pushed === 0
              ? commitMessage
              : `Add ${file.path} via ProjectForge`,
          content: Buffer.from(file.content, "utf8").toString("base64"),
        }),
      },
      token,
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(
        `Failed to push ${file.path} (${res.status}): ${err.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as {
      commit?: { html_url?: string };
    };
    if (data.commit?.html_url) lastCommitUrl = data.commit.html_url;
    pushed += 1;
  }

  return { commit_url: lastCommitUrl, files_pushed: pushed };
}
