import { Button, Grid, Stack, Typography } from "@mui/material";
import { TabsState } from "../components/tabs";

export const MigrateTabsState = ({
  migration,
}: {
  migration: (current: TabsState | any) => TabsState;
}) => {
  const current = JSON.parse(localStorage.getItem("tabsState") ?? "null");
  const migrated = migration(current);

  return (
    <Grid container>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: 20 }}>Current</Typography>
        <pre>
          <code>{JSON.stringify(current, null, 2)}</code>
        </pre>
      </Grid>

      <Grid item xs={6}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography sx={{ fontSize: 20 }}>Migrated</Typography>

          <Button
            onClick={() =>
              localStorage.setItem("tabsState", JSON.stringify(migrated))
            }
          >
            Confirm
          </Button>
        </Stack>
        <pre>
          <code>{JSON.stringify(migrated, null, 2)}</code>
        </pre>
      </Grid>
    </Grid>
  );
};
