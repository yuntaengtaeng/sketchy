import type { ProjectDocument } from "../core/project-change.ts";
import { projectDocumentSchema } from "../mcp/schemas.ts";
import type { ProjectRecord, ProjectStore } from "./project-service.ts";

type ProjectRow = {
  owner_id: string;
  document: string;
};

export class D1ProjectStore implements ProjectStore {
  private readonly database: D1Database;

  constructor(database: D1Database) {
    this.database = database;
  }

  async create(record: ProjectRecord) {
    const result = await this.database
      .prepare(
        `INSERT OR IGNORE INTO projects
          (id, owner_id, revision, updated_at, document)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        record.document.id,
        record.ownerId,
        record.document.revision,
        record.document.updatedAt,
        JSON.stringify(record.document),
      )
      .run();
    return result.meta.changes === 1;
  }

  async get(projectId: string) {
    const row = await this.database
      .prepare("SELECT owner_id, document FROM projects WHERE id = ?")
      .bind(projectId)
      .first<ProjectRow>();
    if (!row) return undefined;

    const document = projectDocumentSchema.parse(
      JSON.parse(row.document),
    ) as ProjectDocument;
    return { ownerId: row.owner_id, document };
  }

  async replace(record: ProjectRecord, expectedRevision: number) {
    const result = await this.database
      .prepare(
        `UPDATE projects
         SET revision = ?, updated_at = ?, document = ?
         WHERE id = ? AND owner_id = ? AND revision = ?`,
      )
      .bind(
        record.document.revision,
        record.document.updatedAt,
        JSON.stringify(record.document),
        record.document.id,
        record.ownerId,
        expectedRevision,
      )
      .run();
    return result.meta.changes === 1;
  }
}
