import { defineConfig } from "cloesce/config";

const config = defineConfig({
  migrationsPath: "./migrations",
  projectName: "tiny-tribe",
  srcPaths: ["./src/data"],
  workersUrl: process.env.CLOESCE_WORKER_URL,
})
  .rawAst((ast) => {
    const userModel = ast.models.User;
    const friendshipModel = ast.models.Friendship;
    if (!userModel || !friendshipModel) {
      return;
    }

    const upsertNav = (varName: string, keyColumns: string[]) => {
      const navProp = {
        var_name: varName,
        model_reference: "Friendship",
        kind: {
          OneToMany: {
            key_columns: keyColumns,
          },
        },
      };
      const index = userModel.navigation_properties.findIndex(
        (nav) => nav.var_name === varName,
      );

      if (index >= 0) {
        userModel.navigation_properties[index] = navProp;
      } else {
        userModel.navigation_properties.push(navProp);
      }
    };

    upsertNav("sentFriendRequests", ["requesterId"]);
    upsertNav("receivedFriendRequests", ["addresseeId"]);

    const requesterIdCol = friendshipModel.columns.find(
      (col) => col.value.name === "requesterId",
    );
    const addresseeIdCol = friendshipModel.columns.find(
      (col) => col.value.name === "addresseeId",
    );
    if (!requesterIdCol || !addresseeIdCol) {
      return;
    }

    const uniqueId = Math.max(
      -1,
      ...friendshipModel.columns.flatMap((col) => col.unique_ids),
      ...friendshipModel.primary_key_columns.flatMap((col) => col.unique_ids),
    ) + 1;

    if (!requesterIdCol.unique_ids.includes(uniqueId)) {
      requesterIdCol.unique_ids.push(uniqueId);
    }

    if (!addresseeIdCol.unique_ids.includes(uniqueId)) {
      addresseeIdCol.unique_ids.push(uniqueId);
    }
  });

export default config;
