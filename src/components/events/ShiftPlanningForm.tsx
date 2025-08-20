{/* N°operatori */}
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-11 w-10 flex items-center justify-center"
      onClick={decrementOperators}
    >
      –
    </Button>

    <Input
      type="number"
      min="1"
      max="20"
      placeholder="N° operatori"
      className="h-11 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      value={form.watch("numOperators")}
      onChange={(e) =>
        form.setValue("numOperators", parseInt(e.target.value) || 1)
      }
    />

    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-11 w-10 flex items-center justify-center"
      onClick={incrementOperators}
    >
      +
    </Button>
  </div>
  {form.formState.errors.numOperators && (
    <p className="text-sm text-destructive">
      {form.formState.errors.numOperators.message}
    </p>
  )}
</div>
