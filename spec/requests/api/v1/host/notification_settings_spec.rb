# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::NotificationSettings" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:host) { create(:user, :host, email_notifications_enabled: true) }
  let(:emcee) { create(:user, :emcee) }

  describe "#show" do
    path "/api/v1/host/notification_settings" do
      get "returns the host's notification settings" do
        tags "Host::NotificationSettings"
        produces "application/json"

        response(200, "returns notification settings") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:email_notifications_enabled]).to eq(true)
          end
        end

        response(403, "returns forbidden for non-host") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#update" do
    path "/api/v1/host/notification_settings" do
      patch "updates the host's notification settings" do
        tags "Host::NotificationSettings"
        consumes "application/json"
        produces "application/json"
        parameter name: :body, in: :body, schema: {
          type: :object,
          properties: { email_notifications_enabled: { type: :boolean } },
          required: [ "email_notifications_enabled" ]
        }

        response(200, "disables email notifications") do
          let(:body) { { email_notifications_enabled: false } }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:email_notifications_enabled]).to eq(false)
            expect(host.reload.email_notifications_enabled).to eq(false)
          end
        end

        response(200, "re-enables email notifications") do
          let(:body) { { email_notifications_enabled: true } }

          before do
            host.update!(email_notifications_enabled: false)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:email_notifications_enabled]).to eq(true)
          end
        end

        response(403, "returns forbidden for non-host") do
          let(:body) { { email_notifications_enabled: false } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
