export const drawerStyles = {
  components: {
    Drawer: {
      // 3. We can add a new visual variant
      variants: {
        "with-shadow": {
          placement: "right",
          boxShadow: "0 0 2px 2px rgba(51, 51, 105, 0.1)",
          bgColor: "white",
        },
      },
    },
  },
};
