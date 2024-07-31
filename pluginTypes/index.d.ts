/// <amd-module name="@scom/scom-widget-test" />
declare module "@scom/scom-widget-test" {
    import { Module, Container, ControlElement } from '@ijstech/components';
    interface ScomWidgetTestElement extends ControlElement {
        widgetName: string;
        widgetType?: string;
        onConfirm?: (data: any, tag?: any) => void;
    }
    export const chartWidgets: string[];
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['i-scom-widget-test']: ScomWidgetTestElement;
            }
        }
    }
    export default class ScomWidgetTest extends Module {
        private _widgetName;
        private _widgetType;
        private pnlWidgetWrapper;
        private actionForm;
        private pnlCustomForm;
        onConfirm: (data: any, tag?: any) => void;
        static create(options?: ScomWidgetTestElement, parent?: Container): Promise<ScomWidgetTest>;
        get widgetName(): string;
        set widgetName(value: string);
        get widgetType(): string;
        set widgetType(value: string);
        private getThemeValues;
        private compareThemes;
        private getActions;
        private loadWidgetConfig;
        show(data?: any): void;
        onClose(): void;
        init(): Promise<void>;
        render(): any;
    }
}
