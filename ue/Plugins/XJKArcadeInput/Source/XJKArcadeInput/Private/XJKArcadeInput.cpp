#include "Modules/ModuleManager.h"
#include "Containers/Ticker.h"
#include "Blueprint/UserWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Components/NativeWidgetHost.h"
#include "GameFramework/PlayerController.h"
#include "Engine/World.h"
#include "UObject/UObjectIterator.h"
#include "InputCoreTypes.h"
#include "SWebBrowser.h"
#include "HAL/IConsoleManager.h"

// Separate from the city module so this feature can compile without rebuilding
// unrelated traffic, vehicles or the user's open scene. The existing phone owns
// all focus, gameplay blocking and navigation.
class FXJKArcadeInputModule final : public IModuleInterface
{
    FTSTicker::FDelegateHandle TickHandle;
    TWeakObjectPtr<UUserWidget> Phone;
    TWeakPtr<SWebBrowser> Browser;
    int32 LastMask = -1;
    double NextSend = 0;
    double NextFind = 0;
    bool WasVisible = false;
    bool Tick(float)
    {
        const double Now = FPlatformTime::Seconds();
        if ((!Phone.IsValid() || !Browser.IsValid()) && Now > NextFind)
        {
            NextFind = Now + .5;
            for (TObjectIterator<UUserWidget> It; It; ++It)
            {
                UUserWidget* Widget = *It;
                if (Widget->HasAnyFlags(RF_ClassDefaultObject) || Widget->GetClass()->GetFName() != TEXT("CityPhoneRoot") ||
                    !Widget->GetWorld() || !Widget->GetWorld()->IsGameWorld() || !Widget->WidgetTree) continue;
                TArray<UWidget*> Widgets;
                Widget->WidgetTree->GetAllWidgets(Widgets);
                for (UWidget* Child : Widgets)
                    if (auto* Host = Cast<UNativeWidgetHost>(Child))
                        if (auto Content = Host->GetContent(); Content.IsValid() && Content->GetTypeAsString() == TEXT("SWebBrowser"))
                        {
                            Phone = Widget;
                            Browser = StaticCastSharedPtr<SWebBrowser>(Content);
                            LastMask = -1;
                            UE_LOG(LogTemp, Display, TEXT("XJK_ARCADE gamepad bridge attached to phone"));
                            break;
                        }
                if (Browser.IsValid()) break;
            }
        }
        const auto Web = Browser.Pin();
        if (!Phone.IsValid() || !Web) return true;
        const bool Visible = Phone->IsVisible() && Phone->IsInViewport();
        if (!Visible)
        {
            if (WasVisible) Web->ExecuteJavascript(TEXT("window.cityPhoneHost&&cityPhoneHost.sleep&&cityPhoneHost.sleep()"));
            WasVisible = false; LastMask = -1; return true;
        }
        WasVisible = true;
        auto* PC = Phone->GetOwningPlayer();
        if (!PC || !PC->IsLocalController()) return true;
        const float X = PC->GetInputAnalogKeyState(EKeys::Gamepad_LeftX);
        const float Y = PC->GetInputAnalogKeyState(EKeys::Gamepad_LeftY);
        const int32 Mask =
            ((PC->IsInputKeyDown(EKeys::Gamepad_DPad_Left) || X < -.28f) ? 1 : 0) |
            ((PC->IsInputKeyDown(EKeys::Gamepad_DPad_Right) || X > .28f) ? 2 : 0) |
            ((PC->IsInputKeyDown(EKeys::Gamepad_DPad_Up) || Y > .28f) ? 4 : 0) |
            ((PC->IsInputKeyDown(EKeys::Gamepad_DPad_Down) || Y < -.28f) ? 8 : 0) |
            (PC->IsInputKeyDown(EKeys::Gamepad_FaceButton_Bottom) ? 16 : 0) |
            ((PC->IsInputKeyDown(EKeys::Gamepad_FaceButton_Left) || PC->IsInputKeyDown(EKeys::Gamepad_RightShoulder)) ? 32 : 0) |
            (PC->IsInputKeyDown(EKeys::Gamepad_Special_Right) ? 64 : 0);
        if (Mask != LastMask || Now >= NextSend)
        {
            Web->ExecuteJavascript(FString::Printf(TEXT("window.cityPhoneHost&&cityPhoneHost.gameInput&&cityPhoneHost.gameInput(%d)"), Mask));
            LastMask = Mask; NextSend = Now + .075;
        }
        return true;
    }
public:
    virtual void StartupModule() override
    {
        TickHandle = FTSTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateRaw(this, &FXJKArcadeInputModule::Tick));
        UE_LOG(LogTemp, Display, TEXT("XJK_ARCADE input ready: LeftStick/DPad, A primary, X/RB secondary, Start pause, B back"));
    }
    virtual void ShutdownModule() override
    {
        FTSTicker::GetCoreTicker().RemoveTicker(TickHandle);
        Phone.Reset(); Browser.Reset();
    }
};
IMPLEMENT_MODULE(FXJKArcadeInputModule, XJKArcadeInput)
