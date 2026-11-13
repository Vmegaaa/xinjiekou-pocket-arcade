using UnrealBuildTool;
public class XJKArcadeInput : ModuleRules
{
    public XJKArcadeInput(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PrivateDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore", "Slate", "SlateCore", "UMG", "WebBrowser"
        });
    }
}
