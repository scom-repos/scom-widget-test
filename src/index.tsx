import {
  Module,
  customModule,
  customElements,
  Styles,
  Container,
  ControlElement,
  application,
  Panel,
  Form,
} from '@ijstech/components';

Styles.Theme.darkTheme.text.primary = '#fff';
Styles.Theme.darkTheme.text.secondary = '#fff';
Styles.Theme.darkTheme.background.modal = '#1A1A1A';
Styles.Theme.darkTheme.input.background = '#232B5A';
Styles.Theme.darkTheme.input.fontColor = '#fff';
Styles.Theme.darkTheme.action.active = 'rgba(255,255,255, 0.16)'
Styles.Theme.applyTheme(Styles.Theme.darkTheme);

interface ScomWidgetTestElement extends ControlElement {
  widgetName: string;
  widgetType?: string;
  onConfirm?: (data: any, tag?: any) => void;
}

export const chartWidgets: string[] = ['@scom/scom-pie-chart', '@scom/scom-line-chart', '@scom/scom-bar-chart', '@scom/scom-area-chart', '@scom/scom-mixed-chart', '@scom/scom-scatter-chart', '@scom/scom-counter'];

const Theme = Styles.Theme.ThemeVars;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['i-scom-widget-test']: ScomWidgetTestElement;
    }
  }
}

@customModule
@customElements('i-scom-widget-test')
export default class ScomWidgetTest extends Module {
  private _widgetName: string;
  private _widgetType: string;
  private pnlWidgetWrapper: Panel;
  private actionForm: Form;
  private pnlCustomForm: Panel;
  onConfirm: (data: any, tag?: any) => void;

  static async create(options?: ScomWidgetTestElement, parent?: Container) {
    let self = new this(parent, options);
    await self.ready();
    return self;
  }

  get widgetName() {
    return this._widgetName;
  }

  set widgetName(value: string) {
    this._widgetName = value;
  }

  get widgetType() {
    return this._widgetType;
  }

  set widgetType(value: string) {
    this._widgetType = value;
  }

  private getThemeValues(theme: any) {
    if (!theme || typeof theme !== 'object') return null;
    let values = {};
    for (let prop in theme) {
      if (theme[prop]) values[prop] = theme[prop];
    }
    return Object.keys(values).length ? values : null;
  }

  private compareThemes(oldValues: any, newValues: any) {
    for (let prop in newValues) {
      if (!oldValues.hasOwnProperty(prop) || newValues[prop] !== oldValues[prop]) {
        return true;
      }
    }
    return false;
  }

  private getActions(elm: any, isChart: boolean) {
    const configs = elm.getConfigurators(this.widgetType) || [];
    let configurator, action;
    if (isChart) {
      configurator = configs.find((conf: any) => conf.target === 'Builders');
      action = configurator?.getActions && configurator.getActions().find((action: any) => action.name === 'Data');
    } else {
      configurator = configs.find((conf: any) => conf.target === 'Editor');
      action = configurator.getActions()?.[0];
    }
    return action;
  }

  private async loadWidgetConfig(widgetData: any) {
    this.pnlWidgetWrapper.visible = false;
    const widget: any = await application.createElement(this.widgetName);
    this.pnlWidgetWrapper.clearInnerHTML();
    this.pnlWidgetWrapper.visible = true;
    this.pnlWidgetWrapper.appendChild(widget);
    if (widget?.getConfigurators) {
      const isChart = chartWidgets.includes(this.widgetName);
      const action = this.getActions(widget, isChart);
      const builder = widget.getConfigurators(this.widgetType).find((conf: any) => conf.target === 'Builders');
      const hasBuilder = builder && typeof builder.setData === 'function';
      if (action) {
        if (action.customUI) {
          this.actionForm.visible = false;
          if (hasBuilder) {
            builder.setData(widgetData || {});
          }
          const customForm = await action.customUI.render(hasBuilder ? { ...widget.getData() } : {}, async (result: boolean, data: any) => {
            if (this.onConfirm) {
              const { dark, light, tag } = data;
              let widgetTag = {};
              const darkTheme = this.getThemeValues(dark);
              const lightTheme = this.getThemeValues(light);
              if (darkTheme) {
                widgetTag['dark'] = darkTheme;
              }
              if (lightTheme) {
                widgetTag['light'] = lightTheme;
              }
              widgetTag = { ...widgetTag, ...tag };
              let setupData = {};
              if (builder && typeof builder.setupData === 'function') {
                const hasSetup = await builder.setupData(data);
                if (!hasSetup) return;
                setupData = await builder.getData();
              }
              this.onConfirm({ ...data, ...setupData }, widgetTag);
            }
          });
          this.pnlCustomForm.append(customForm);
          this.pnlCustomForm.visible = true;
        } else {
          this.pnlCustomForm.visible = false;
          this.actionForm.uiSchema = action.userInputUISchema;
          this.actionForm.jsonSchema = action.userInputDataSchema;
          this.actionForm.formOptions = {
            columnWidth: '100%',
            columnsPerRow: 1,
            confirmButtonOptions: {
              caption: 'Confirm',
              backgroundColor: Theme.colors.primary.main,
              fontColor: Theme.colors.primary.contrastText,
              padding: { top: '0.5rem', bottom: '0.5rem', right: '1rem', left: '1rem' },
              border: { radius: '0.5rem' },
              hide: false,
              onClick: async () => {
                if (this.onConfirm) {
                  const formData = await this.actionForm.getFormData();
                  const { dark, light, tag } = formData;
                  let widgetTag = {};
                  const darkTheme = this.getThemeValues(dark);
                  const lightTheme = this.getThemeValues(light);
                  if (darkTheme) {
                    widgetTag['dark'] = darkTheme;
                  }
                  if (lightTheme) {
                    widgetTag['light'] = lightTheme;
                  }
                  widgetTag = { ...widgetTag, ...tag };
                  let setupData = {};
                  if (builder && typeof builder.setupData === 'function') {
                    const hasSetup = await builder.setupData(formData);
                    if (!hasSetup) return;
                    setupData = await builder.getData();
                  }
                  this.onConfirm({ ...formData, ...setupData }, widgetTag);
                }
              }
            },
            onChange: async () => {
              const formData = await this.actionForm.getFormData();
              if (typeof widget.setTag === 'function' && formData) {
                const oldTag = typeof widget.getTag === 'function' ? await widget.getTag() : {};
                const oldDark = this.getThemeValues(oldTag?.dark);
                const oldLight = this.getThemeValues(oldTag?.light);
                const { dark, light } = formData;
                let tag = {};
                const darkTheme = this.getThemeValues(dark);
                const lightTheme = this.getThemeValues(light);
                let isTagChanged = false;
                if (darkTheme) {
                  tag['dark'] = darkTheme;
                  isTagChanged = this.compareThemes(oldDark, darkTheme);
                }
                if (lightTheme) {
                  tag['light'] = lightTheme;
                  if (!isTagChanged) {
                    isTagChanged = this.compareThemes(oldLight, lightTheme);
                  }
                }
                if (Object.keys(tag).length) {
                  widget.setTag(tag);
                }
                if (isTagChanged) return;
              }
              const validationResult = this.actionForm.validate(formData, this.actionForm.jsonSchema, { changing: false });
              if (validationResult.valid) {
                if (hasBuilder) {
                  builder.setData(formData);
                } else if (typeof widget.setData === 'function') {
                  widget.setData(formData);
                }
              }
            },
            customControls: action.customControls,
            dateTimeFormat: {
              date: 'YYYY-MM-DD',
              time: 'HH:mm:ss',
              dateTime: 'MM/DD/YYYY HH:mm'
            }
          };
          this.actionForm.renderForm();
          this.actionForm.clearFormData();
          this.actionForm.visible = true;

          // Set default data
          setTimeout(async () => {
            if (widgetData) {
              this.actionForm.setFormData({ ...widgetData });
              const { dark, light, tag } = widgetData;
              let widgetTag = {};
              const darkTheme = this.getThemeValues(dark);
              const lightTheme = this.getThemeValues(light);
              if (darkTheme) {
                widgetTag['dark'] = darkTheme;
              }
              if (lightTheme) {
                widgetTag['light'] = lightTheme;
              }
              widgetTag = { ...widgetTag, ...tag };
              if (typeof widget.setTag === 'function' && Object.keys(widgetTag).length) {
                widget.setTag(widgetTag);
              }
              if (hasBuilder) {
                builder.setData(widgetData);
              } else if (typeof widget.setData === 'function') {
                widget.setData(widgetData);
              }
            } else if (hasBuilder) {
              builder.setData({});
              const elmData = await widget.getData();
              this.actionForm.setFormData({ ...elmData });
            }
          })
        }
      }
    }
  }

  show(data?: any) {
    if (!this.widgetName) return;
    this.loadWidgetConfig(data);
  }

  onClose() {
    this.closeModal();
  }

  async init() {
    super.init();
    this.widgetName = this.getAttribute('widgetName', true);
    this.widgetType = this.getAttribute('widgetType', true);
    this.onConfirm = this.getAttribute('onConfirm', true) || this.onConfirm;
  }

  render() {
    return (
      <i-vstack gap="1rem" padding={{ left: 10, right: 10 }}>
        <i-hstack gap={8} justifyContent="space-between" margin={{ top: 10 }}>
          <i-label caption="Config" font={{ bold: true }} />
          <i-icon name="times" width={20} height={20} fill="#f50057" cursor="pointer" onClick={this.onClose} />
        </i-hstack>
        <i-grid-layout
          gap={{ column: '0.5rem' }}
          templateColumns={['calc(50% - 0.25rem)', 'calc(50% - 0.25rem)']}
          mediaQueries={[
            {
              maxWidth: '768px',
              properties: {
                templateColumns: ['100%']
              }
            }
          ]}
        >
          <i-panel id="pnlWidgetWrapper" />
          <i-panel>
            <i-form id="actionForm" visible={false} />
            <i-panel id="pnlCustomForm" visible={false} />
          </i-panel>
        </i-grid-layout>
      </i-vstack>
    )
  }
}